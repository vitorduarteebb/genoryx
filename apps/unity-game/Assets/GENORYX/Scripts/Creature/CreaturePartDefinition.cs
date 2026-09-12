using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Definicao de uma peca modular.
    ///
    /// prefab == null  -> a peca e produzida proceduralmente por CreatureMeshLab.
    /// prefab != null  -> a peca vem de um asset autorado (pipeline Meshy -> Blender -> FBX).
    ///
    /// O CreatureAssembler nao sabe a diferenca: o contrato e o socket, nao a origem do mesh.
    /// Nenhum caminho aqui chama Meshy em runtime.
    /// </summary>
    [CreateAssetMenu(menuName = "GENORYX/Creature Part Definition", fileName = "CreaturePart")]
    public class CreaturePartDefinition : ScriptableObject
    {
        public string id;
        public string displayName;
        public CreatureSlot slot;

        /// <summary>
        /// Malha autorada. Tem prioridade sobre a geracao procedural.
        /// Para pecas skinadas, precisa estar bindada ao GENORYX_CORE_RIG na ordem canonica
        /// (garantido por tools/creature_pipeline/bind_to_skeleton.py + validate_socket.py).
        /// </summary>
        public Mesh mesh;

        /// <summary>Reservado para pecas compostas (mesh + VFX filho). Nao usado na V1.</summary>
        public GameObject prefab;
        public string compatibleChassis = CreatureParts.ChassisV1;
        public CreatureRarity rarity = CreatureRarity.Common;
        public Vector3 boundsSize = new Vector3(0.2f, 0.2f, 0.2f);
        public string socket;
        public CreatureFitProfile fitProfile = CreatureFitProfile.Default;
        public CreatureMaterialProfile materialProfile = CreatureMaterialProfile.Skin;
        public string[] mutationCompatibility = new string[0];
        public bool mirrored;
        public bool centered;

        public bool IsProcedural => mesh == null && prefab == null;

        public bool SupportsChassis(string chassisId)
        {
            return string.IsNullOrEmpty(compatibleChassis) || compatibleChassis == chassisId;
        }
    }

    public enum CreatureRarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    [System.Serializable]
    public struct CreatureFitProfile
    {
        public Vector3 positionOffset;
        public Vector3 rotationOffset;
        public float scaleMultiplier;

        public static CreatureFitProfile Default => new CreatureFitProfile
        {
            positionOffset = Vector3.zero,
            rotationOffset = Vector3.zero,
            scaleMultiplier = 1f
        };

        public void Apply(Transform t, float extraScale)
        {
            var scale = (scaleMultiplier <= 0.0001f ? 1f : scaleMultiplier) * extraScale;
            t.localPosition = positionOffset;
            t.localRotation = Quaternion.Euler(rotationOffset);
            t.localScale = Vector3.one * scale;
        }
    }
}
