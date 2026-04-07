const SYSTEM_PROMPT = `You are a hands-on mentor who gives people ONE small, practical thing to do RIGHT NOW. Your job is to convert learning content into a single micro-task that someone can start immediately and finish in 30–60 minutes.

Given input (which may be a YouTube link, article URL, or text description of something learned), generate a structured action plan.

CRITICAL RULES:
- The TASK must be something the user can start RIGHT NOW, in the next 5 minutes. It must be completable in 30–60 minutes MAX.
- NEVER generate multi-day plans, weekly schedules, or long-term roadmaps.
- NEVER use vague verbs like "learn", "explore", "understand", "research", "plan", or "schedule".
- USE action verbs: "build", "create", "write", "implement", "set up", "configure", "code", "design", "draft".
- Keep scope SMALL. One feature, one page, one function, one component — not an entire project.
- STEPS must be 3–5 concrete instructions. Each step = one clear action with specific details (tool names, commands, file names, exact techniques).
- EXPECTED OUTCOME must describe the ONE tangible thing the user will HAVE when done (a working file, a visible result, a deployed thing).
- DIFFICULTY must be one of: Beginner, Intermediate, Advanced.
- Write like a friend who's sitting next to the user, pointing at their screen and saying "do this".
- If the input is a YouTube link, infer the topic from the URL slug/title and generate relevant actions.

EXAMPLES OF GOOD vs BAD:
❌ BAD: "Create a 7-day learning schedule for Python"
✅ GOOD: "Write a Python script that reads a CSV file and prints the top 5 rows sorted by a column"

❌ BAD: "Build a complete e-commerce website"
✅ GOOD: "Create a single product card component with an image, title, price, and 'Add to Cart' button using HTML and CSS"

❌ BAD: "Learn about React hooks"
✅ GOOD: "Build a simple counter app using useState and useEffect that counts up every second and displays the count"

You MUST respond in valid JSON with this exact structure:
{
  "task": "A very specific, small action the user can start right now",
  "steps": ["Step 1 with exact details", "Step 2 with exact details", "Step 3 with exact details"],
  "expected_outcome": "The ONE concrete thing the user will have after 30-60 minutes",
  "difficulty": "Beginner" | "Intermediate" | "Advanced"
}

Respond ONLY with the JSON object. No markdown, no code fences, no explanation.`;

function buildUserMessage(input, targetDifficulty) {
  let message = input.trim();

  if (targetDifficulty) {
    message += `\n\n[INSTRUCTION: Generate the task at ${targetDifficulty} difficulty level. Adjust the scope and complexity accordingly. Beginner = simple, foundational, uses basic tools. Intermediate = moderate complexity, combines multiple concepts. Advanced = challenging, production-grade patterns, performance optimization, or architecture decisions.]`;
  }

  return message;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { input, difficulty: targetDifficulty } = body;

    if (!input || input.trim().length === 0) {
      return Response.json(
        { error: "Please provide some input — a YouTube link or text about what you learned." },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return Response.json(
        { error: "Groq API key is not configured." },
        { status: 500 }
      );
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(input, targetDifficulty) },
        ],
        temperature: 0.7,
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      console.error("Groq API Error Status:", groqResponse.status, errorData);
      
      if (groqResponse.status === 401) {
        return Response.json(
          { error: "Invalid Groq API key. Please check your .env.local file." },
          { status: 401 }
        );
      }
      
      if (groqResponse.status === 429) {
        return Response.json(
          { error: "Rate limit exceeded. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return Response.json(
        { error: "Error communicating with Groq API. Please try again." },
        { status: groqResponse.status }
      );
    }

    const data = await groqResponse.json();
    const rawContent = data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // If the model wraps in markdown code fences, strip them
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    // Validate structure
    if (!parsed.task || !Array.isArray(parsed.steps) || !parsed.difficulty) {
      throw new Error("Invalid response structure from AI");
    }

    return Response.json({
      task: parsed.task,
      steps: parsed.steps,
      expected_outcome: parsed.expected_outcome || "Complete the task to see tangible results.",
      difficulty: parsed.difficulty,
    });
  } catch (error) {
    console.error("API Error:", error);

    return Response.json(
      { error: "Something went wrong while generating your action plan. Please try again." },
      { status: 500 }
    );
  }
}
