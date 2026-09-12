using UnityEngine;

namespace Genoryx
{
    public class FormationLayout : MonoBehaviour
    {
        public Transform playerFront;
        public Transform playerMiddle;
        public Transform playerBack;
        public Transform enemyFront;
        public Transform enemyMiddle;
        public Transform enemyBack;

        public Vector3 Position(bool enemy, string slot)
        {
            var node = slot switch
            {
                "FRONT" => enemy ? enemyFront : playerFront,
                "MIDDLE" => enemy ? enemyMiddle : playerMiddle,
                _ => enemy ? enemyBack : playerBack
            };
            return node != null ? node.position : transform.position;
        }

        public static void ApplyDefault(Transform root)
        {
            Place(root, "PlayerFront", new Vector3(0f, 0f, -4.2f));
            Place(root, "PlayerMiddle", new Vector3(-2.1f, 0f, -6.6f));
            Place(root, "PlayerBack", new Vector3(2.2f, 0f, -8.8f));
            Place(root, "EnemyFront", new Vector3(0f, 0f, 4.2f));
            Place(root, "EnemyMiddle", new Vector3(2.1f, 0f, 6.6f));
            Place(root, "EnemyBack", new Vector3(-2.2f, 0f, 8.8f));
        }

        static void Place(Transform root, string name, Vector3 pos)
        {
            var child = root.Find(name);
            if (child == null)
            {
                child = new GameObject(name).transform;
                child.SetParent(root, false);
            }
            child.localPosition = pos;
        }
    }
}
