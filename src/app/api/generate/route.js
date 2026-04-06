const SYSTEM_PROMPT = `You are a world-class coding mentor and productivity coach. Your job is to convert learning content into a single, highly actionable task that a person can sit down and complete in 30–90 minutes.

Given input (which may be a YouTube link, article URL, or text description of something learned), generate a structured action plan.

RULES:
- The TASK must be ultra-specific and completable in 30–90 minutes. NEVER use vague verbs like "learn", "explore", "understand", or "research". Use action verbs like "build", "create", "write", "implement", "set up", "configure", "deploy", "refactor".
- STEPS must be concrete, numbered instructions. Each step should describe exactly WHAT to do and HOW. Include specific tools, commands, file names, or techniques where possible.
- EXPECTED OUTCOME must describe the tangible deliverable — what the user will HAVE after completing the task (e.g., "A working REST API with 3 endpoints", "A styled landing page with responsive navigation").
- DIFFICULTY must be one of: Beginner, Intermediate, Advanced.
- Write as if you are a mentor giving instructions to a student sitting next to you.
- No generic advice. No theory. Pure execution.
- If the input is a YouTube link, infer the topic from the URL slug/title and generate relevant actions.

You MUST respond in valid JSON with this exact structure:
{
  "task": "A very specific action described in one clear sentence",
  "steps": ["Step 1 with specific details", "Step 2 with specific details", "Step 3 with specific details"],
  "expected_outcome": "A concrete description of what the user will have after completing this task",
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
