
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { DesignStyle, ImageSize } from "../types";

// Helper for Base64 cleaning
const cleanBase64 = (base64: string) => base64.replace(/^data:image\/\w+;base64,/, "");

export class GeminiService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  // Generate reimagined room
  async reimagineRoom(imageBase64: string, style: DesignStyle): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64(imageBase64), mimeType: 'image/png' } },
          { text: `Reimagine this room exactly as it is but completely redecorated in a ${style} style. Maintain the architectural layout (walls, windows, doors) but replace all furniture, textures, and lighting with high-end ${style} design elements.` }
        ]
      }
    });

    return this.extractFirstImage(response);
  }

  // Refine existing design
  async refineDesign(currentImageBase64: string, instruction: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64(currentImageBase64), mimeType: 'image/png' } },
          { text: `Update this interior design based on the following instruction: "${instruction}". Keep the rest of the room exactly the same.` }
        ]
      }
    });

    return this.extractFirstImage(response);
  }

  // High-res Image Generation (Pro)
  async generateHighResRoom(prompt: string, size: ImageSize): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: `A photorealistic interior design render of: ${prompt}. Cinematic lighting, 8k resolution, professional architectural photography.` }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size
        }
      }
    });

    return this.extractFirstImage(response);
  }

  // Video Generation (Veo)
  async animateRoom(imageBase64: string, prompt: string): Promise<string> {
    let operation = await this.ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'A cinematic slow pan around this beautiful interior space.',
      image: {
        imageBytes: cleanBase64(imageBase64),
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await this.ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Text-to-Speech
  async speakText(text: string): Promise<AudioBuffer> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Narrate helpfully: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return this.decodeAudioData(this.decodeBase64(base64Audio), ctx, 24000, 1);
  }

  // Chat with Grounding for shopping
  async chatAboutDesign(message: string, currentImage?: string): Promise<{ text: string; sources: any[] }> {
    const parts: any[] = [{ text: message }];
    if (currentImage) {
      parts.push({ inlineData: { data: cleanBase64(currentImage), mimeType: 'image/png' } });
    }

    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: "You are an elite interior design consultant. Analyze images provided and answer questions. When recommending furniture, describe them vividly and provide shoppable descriptions. If you mention real-world items, use Google Search to provide grounding links.",
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: response.text || "I couldn't generate a response.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }

  // Quick Chat (Flash Lite)
  async quickChat(message: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: message,
      config: {
        systemInstruction: "Provide a very brief, friendly interior design tip based on the user's input. Maximum 2 sentences.",
      },
    });
    return response.text || "";
  }

  private extractFirstImage(response: any): string {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image found in model response");
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const gemini = new GeminiService();
