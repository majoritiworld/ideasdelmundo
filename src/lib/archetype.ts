import API_ROUTES from "@/constants/api-routes.constants";

export interface ArchetypeReference {
  name: string;
  descriptor: string;
  connection: string;
}

export interface ArchetypeResult {
  archetypeName: string;
  archetypeDescription: string;
  purposeStatement: string;
  references: [ArchetypeReference, ArchetypeReference];
}

export interface GenerateArchetypePayload {
  name: string;
  transcript: string;
}

export async function generateArchetype(
  payload: GenerateArchetypePayload
): Promise<ArchetypeResult> {
  const response = await fetch(API_ROUTES.ARCHETYPE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ArchetypeResult & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to generate archetype");
  }

  return data;
}
