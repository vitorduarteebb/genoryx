export type GeneratedEggImage = {
  bytes: Buffer;
  mimeType: "image/png";
  model: string;
  modelSnapshot: string;
};

export interface EggImageProvider {
  generateEgg(prompt: string, primaryColor: string): Promise<GeneratedEggImage>;
}
