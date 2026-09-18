import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

const PRIMARY_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-3.8-flash';

async function generateWithFallback(ai: GoogleGenAI, options: any) {
  try {
    return await ai.models.generateContent({
      ...options,
      model: PRIMARY_MODEL,
    });
  } catch (err) {
    console.warn(`Gemini call with ${PRIMARY_MODEL} failed, retrying with ${FALLBACK_MODEL}:`, err);
    return await ai.models.generateContent({
      ...options,
      model: FALLBACK_MODEL,
    });
  }
}

export interface DecomposeResult {
  total_units: number;
  unit_label: string;
  milestones: {
    step_order: number;
    title: string;
    description: string;
    est_minutes: number;
  }[];
}

export async function decomposeProjectWithGemini(params: {
  taskName: string;
  whyReason?: string;
  dailyMinutesAvailable?: number;
  importance?: number;
}): Promise<DecomposeResult> {
  const ai = getAiClient();

  const dailyMinutes = params.dailyMinutesAvailable || 60;
  const prompt = `Decompose this unstructured project/goal into a sequential, actionable, step-by-step roadmap of exactly 4 to 8 concrete milestones.
Each milestone must be a discrete, self-contained unit of work that can be accomplished in a single focused session.
The user has approximately ${dailyMinutes} minutes available per session.

Project Name: "${params.taskName}"
Core Motivation ("Why"): "${params.whyReason || 'Skill mastery and practical execution'}"
Priority Level: ${params.importance || 2}/5

Requirements:
- step_order must start at 1 and be sequentially ordered (1, 2, 3...).
- title must be direct, specific, and active (e.g., "Design SQLite database schema & relations").
- description should explain the exact deliverable for this milestone.
- est_minutes should be estimated minutes required (between 30 and 180).
- total_units must equal the number of milestones.
- unit_label must be "milestones".`;

  if (ai) {
    try {
      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite single-tasking productivity coach and technical project architect. You break down complex goals into rigorous, bite-sized, sequential milestones to prevent decision fatigue.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              total_units: {
                type: Type.INTEGER,
                description: 'Total number of decomposed milestones',
              },
              unit_label: {
                type: Type.STRING,
                description: 'Label for the units, usually "milestones"',
              },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step_order: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    est_minutes: { type: Type.INTEGER },
                  },
                  required: ['step_order', 'title', 'description', 'est_minutes'],
                },
              },
            },
            required: ['total_units', 'unit_label', 'milestones'],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as DecomposeResult;
        if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
          // Normalize step orders
          parsed.milestones.forEach((m, idx) => {
            m.step_order = idx + 1;
            if (!m.est_minutes) m.est_minutes = dailyMinutes;
          });
          parsed.total_units = parsed.milestones.length;
          parsed.unit_label = 'milestones';
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, falling back to intelligent rule-based decomposition:', err);
    }
  }

  // Fallback intelligent decomposition if API key is not configured or network unavailable
  const fallbackMilestones = [
    {
      step_order: 1,
      title: `Define scope & clear requirements for ${params.taskName}`,
      description: 'Write specifications, key user stories, and measurable success criteria.',
      est_minutes: Math.min(dailyMinutes, 60),
    },
    {
      step_order: 2,
      title: 'Research architectural patterns & gather required tooling',
      description: 'Review reference implementations, dependencies, and environment setup.',
      est_minutes: Math.min(dailyMinutes, 90),
    },
    {
      step_order: 3,
      title: 'Build minimum viable foundation / prototype',
      description: 'Implement core functionality or first working proof-of-concept.',
      est_minutes: Math.max(dailyMinutes, 90),
    },
    {
      step_order: 4,
      title: 'Iterate, test edge cases, and refine execution',
      description: 'Handle errors, verify outputs, and polish performance.',
      est_minutes: Math.min(dailyMinutes, 60),
    },
    {
      step_order: 5,
      title: 'Review deliverable against original motivation & finalize',
      description: `Evaluate against: "${params.whyReason || 'Initial goal'}". Final review and ship.`,
      est_minutes: Math.min(dailyMinutes, 45),
    },
  ];

  return {
    total_units: fallbackMilestones.length,
    unit_label: 'milestones',
    milestones: fallbackMilestones,
  };
}

export async function getCoachAdviceWithGemini(params: {
  taskName: string;
  taskType: string;
  whyReason?: string | null;
  currentPosition: string;
  nextMission: string;
  streak: number;
}): Promise<string> {
  const ai = getAiClient();

  const prompt = `Give a 2-sentence radical single-tasking motivational advice and tactical micro-tip for today's session.
The user is working on: "${params.taskName}" (${params.taskType}).
Current state: ${params.currentPosition}
Today's exact mission: ${params.nextMission}
Core motivation ("Why"): "${params.whyReason || 'Long term mastery'}"
Current Single-Focus Streak: ${params.streak} consecutive days.

Tone: Minimalist, stoic, disciplined, brutalist clarity. No exclamation marks, no fake hype, no toxic positivity. Focus on eliminating distractions and executing ONE thing.`;

  if (ai) {
    try {
      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are the OneFocus stoic productivity engine. You enforce radical single-tasking. Your words are concise, razor-sharp, and eliminate cognitive clutter.',
          temperature: 0.7,
        },
      });
      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn('Gemini coach advice failed:', err);
    }
  }

  // Fallback stoic advice
  return `Commit completely to ${params.nextMission}. Radical single-tasking works because multitasking is an illusion of progress; execute this single step and ignore everything else.`;
}
