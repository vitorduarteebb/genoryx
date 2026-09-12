using UnityEngine;

namespace Genoryx
{
    /// <summary>Marcador discreto no chão. Sem anel enorme.</summary>
    public class PlayerBeacon : MonoBehaviour
    {
        GameObject mark;

        void Start()
        {
            mark = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            mark.name = "PlayerMark";
            mark.transform.SetParent(transform, false);
            mark.transform.localPosition = new Vector3(0f, 0.03f, 0f);
            mark.transform.localScale = new Vector3(0.7f, 0.02f, 0.7f);
            SliceMaterials.Paint(mark, new Color(0.9f, 0.76f, 0.28f), 0.4f);
            var col = mark.GetComponent<Collider>();
            if (col != null)
            {
                Object.Destroy(col);
            }
        }
    }
}
