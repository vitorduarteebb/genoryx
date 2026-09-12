using UnityEngine;
using System.Runtime.InteropServices;

public class BattleBridge : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void GenoryxSendIntent(string json);

    public void LoadBattleState(string json)
    {
        Debug.Log("GENORYX presentation state received. No combat math here.");
        // Deserialize BattlePresentationState and place creatures on FRONT / MIDDLE / BACK (Combat Matrix V2).
        // Legacy V1 replays may still send BACK_LEFT / BACK_RIGHT. Unity never decides formation or targets.
    }

    public void ApplyBattleEvent(string json)
    {
        Debug.Log("ApplyBattleEvent (presentation only): " + json);
    }

    public void SetValidTargets(string json)
    {
        Debug.Log("SetValidTargets: " + json);
    }

    public void SetSelectedCard(string json)
    {
        Debug.Log("SetSelectedCard: " + json);
    }

    public void EmitIntent(string json)
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        GenoryxSendIntent(json);
#else
        Debug.Log(json);
#endif
    }
}
