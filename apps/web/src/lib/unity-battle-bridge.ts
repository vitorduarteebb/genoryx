import type { BattleIntent, BattlePresentationState } from "@nexora/game-engine";

type UnityHost = {
  SendMessage: (objectName: string, method: string, value?: string) => void;
};

declare global {
  interface Window {
    createUnityInstance?: (canvas: HTMLCanvasElement, config: Record<string, unknown>) => Promise<UnityHost>;
    genoryxBattleIntent?: (payload: string) => void;
    genoryxWorldIntent?: (payload: string) => void;
  }
}

export async function loadUnityBattle(canvas: HTMLCanvasElement): Promise<UnityHost | null> {
  if (typeof window.createUnityInstance !== "function") {
    return null;
  }
  return window.createUnityInstance(canvas, {
    dataUrl: "/unity-battle/Build/Build.data",
    frameworkUrl: "/unity-battle/Build/Build.framework.js",
    codeUrl: "/unity-battle/Build/Build.wasm",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "GENORYX",
    productName: "BattleRenderer",
  });
}

export function sendBattleState(host: UnityHost | null, state: BattlePresentationState) {
  host?.SendMessage("BattleBridge", "LoadBattleState", JSON.stringify(state));
}

export function sendBattleEvent(host: UnityHost | null, event: unknown) {
  host?.SendMessage("BattleBridge", "ApplyBattleEvent", JSON.stringify(event));
}

export function sendValidTargets(host: UnityHost | null, targetIds: string[]) {
  host?.SendMessage("BattleBridge", "SetValidTargets", JSON.stringify({ targetIds }));
}

export function sendSelectedCard(host: UnityHost | null, card: unknown) {
  host?.SendMessage("BattleBridge", "SetSelectedCard", JSON.stringify(card));
}

export function bindBattleIntents(onIntent: (intent: BattleIntent) => void) {
  window.genoryxBattleIntent = (payload: string) => {
    try {
      onIntent(JSON.parse(payload) as BattleIntent);
    } catch {
      return;
    }
  };
  return () => {
    delete window.genoryxBattleIntent;
  };
}
