const DOC_GENERATOR_INSTRUCTIONS = `You are a Principal Technical Writer and Cloud Architect.
Generate a comprehensive, publication-ready System Architecture Specification (Markdown) based on the provided draw.io XML diagram.

Include the following structured sections:
# System Architecture Specification: [System Title]

## 1. Executive Summary & Overview
High-level overview of the system, its primary purpose, and architectural paradigm (e.g. event-driven microservices, serverless, tiered web application).

## 2. Component Inventory & Dictionary
A clean markdown table of all components with Columns:
| Component | Type | Responsibility / Role |

## 3. Data Flow & Communication Lifecycle
Step-by-step description of how requests or events enter the system, traverse services, and persist or egress.

## 4. Reliability, High Availability & Scaling Strategy
Resilience patterns, caching layers, queue buffers, and redundancy mechanisms in the design.

## 5. Security & Threat Modeling Considerations
Network perimeter defenses, identity boundaries, encryption in-transit/at-rest, and recommendations.

## 6. Architecture Decision Records (ADR Summary)
Key architectural choices reflected in this design and their rationales.

Return ONLY pure, professional Markdown text.`;

export async function generateTechSpecDocument(
  xml: string,
  apiKey?: string
): Promise<string> {
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || "";
  const cleanStored = storedKey.includes("AIzaSyBCdBG4Cu") ? "" : storedKey;
  const cleanPassed = (apiKey && !apiKey.includes("AIzaSyBCdBG4Cu")) ? apiKey : "";
  const keyToUse = cleanPassed || envKey || cleanStored;

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ];

  let lastError = '';

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          keyToUse.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: DOC_GENERATOR_INSTRUCTIONS },
                  { text: `Diagram XML:\n${xml.slice(0, 15000)}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${model}`;
        continue;
      }

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      return raw;
    } catch (err) {
      lastError = String(err);
    }
  }

  throw new Error(`Failed to generate documentation: ${lastError}`);
}

