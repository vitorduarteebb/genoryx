using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Documentacao visual das zonas de encaixe. Ativo com CreatureAssembler.debugSockets.
    /// Mostra ponto, orientacao, bounds aceitaveis e nome de cada socket.
    /// </summary>
    public static class CreatureSocketGizmos
    {
        public static void Draw(Transform[] bones)
        {
            if (bones == null)
            {
                return;
            }

            for (var i = 0; i < bones.Length && i < CreatureSockets.BoneOrder.Length; i++)
            {
                var bone = bones[i];
                if (bone == null)
                {
                    continue;
                }

                var name = CreatureSockets.BoneOrder[i];
                var zone = ZoneOf(name);
                Gizmos.color = ZoneColor(zone);

                var size = ZoneBounds(name);
                Gizmos.DrawWireSphere(bone.position, 0.012f);

                var previous = Gizmos.matrix;
                Gizmos.matrix = Matrix4x4.TRS(bone.position, bone.rotation, Vector3.one);
                Gizmos.DrawWireCube(Vector3.zero, size);
                Gizmos.matrix = previous;

                Gizmos.color = Color.green;
                Gizmos.DrawLine(bone.position, bone.position + bone.up * 0.045f);
                Gizmos.color = Color.blue;
                Gizmos.DrawLine(bone.position, bone.position + bone.forward * 0.045f);
                Gizmos.color = Color.red;
                Gizmos.DrawLine(bone.position, bone.position + bone.right * 0.045f);

#if UNITY_EDITOR
                UnityEditor.Handles.color = ZoneColor(zone);
                UnityEditor.Handles.Label(bone.position + Vector3.up * 0.03f, name);
#endif
            }
        }

        public enum SocketZone
        {
            Head,
            Body,
            FrontLimb,
            RearLimb,
            Tail,
            BackTrait,
            Core,
            Structural
        }

        public static SocketZone ZoneOf(string bone)
        {
            return bone switch
            {
                CreatureSockets.Head or CreatureSockets.EyeL or CreatureSockets.EyeR
                    or CreatureSockets.HornL or CreatureSockets.HornR => SocketZone.Head,
                CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR
                    or CreatureSockets.FrontFootL or CreatureSockets.FrontFootR => SocketZone.FrontLimb,
                CreatureSockets.RearLimbL or CreatureSockets.RearLimbR
                    or CreatureSockets.RearFootL or CreatureSockets.RearFootR => SocketZone.RearLimb,
                CreatureSockets.TailRoot or CreatureSockets.TailMid or CreatureSockets.TailTip => SocketZone.Tail,
                CreatureSockets.BackL or CreatureSockets.BackR => SocketZone.BackTrait,
                CreatureSockets.Core => SocketZone.Core,
                CreatureSockets.Body => SocketZone.Body,
                _ => SocketZone.Structural
            };
        }

        public static Color ZoneColor(SocketZone zone)
        {
            return zone switch
            {
                SocketZone.Head => new Color(1f, 0.35f, 0.35f),
                SocketZone.Body => new Color(0.35f, 0.7f, 1f),
                SocketZone.FrontLimb => new Color(0.35f, 1f, 0.45f),
                SocketZone.RearLimb => new Color(1f, 0.85f, 0.25f),
                SocketZone.Tail => new Color(0.8f, 0.4f, 1f),
                SocketZone.BackTrait => new Color(1f, 0.55f, 0.15f),
                SocketZone.Core => new Color(0.2f, 1f, 0.95f),
                _ => new Color(0.6f, 0.6f, 0.6f)
            };
        }

        /// <summary>Bounds aceitaveis por socket. Peca que estoura isto deve ser rejeitada.</summary>
        public static Vector3 ZoneBounds(string bone)
        {
            return bone switch
            {
                CreatureSockets.Head => new Vector3(0.48f, 0.30f, 0.36f),
                CreatureSockets.Body => new Vector3(0.66f, 0.50f, 0.64f),
                CreatureSockets.EyeL or CreatureSockets.EyeR => new Vector3(0.08f, 0.08f, 0.10f),
                CreatureSockets.HornL or CreatureSockets.HornR => new Vector3(0.12f, 0.26f, 0.18f),
                CreatureSockets.BackL or CreatureSockets.BackR => new Vector3(0.14f, 0.18f, 0.40f),
                CreatureSockets.Core => new Vector3(0.12f, 0.12f, 0.12f),
                CreatureSockets.TailRoot => new Vector3(0.16f, 0.16f, 0.42f),
                CreatureSockets.TailMid or CreatureSockets.TailTip => new Vector3(0.12f, 0.12f, 0.26f),
                CreatureSockets.FrontLimbL or CreatureSockets.FrontLimbR
                    or CreatureSockets.RearLimbL or CreatureSockets.RearLimbR => new Vector3(0.14f, 0.22f, 0.14f),
                _ => new Vector3(0.10f, 0.10f, 0.10f)
            };
        }
    }
}
