using UnityEngine;

namespace Genoryx
{
    public static class CharacterFaceEyes
    {
        public static void ApplyFace(CharacterAssembler assembler)
        {
            if (assembler == null || assembler.visualRoot == null)
            {
                return;
            }

            SkinnedMeshRenderer head = null;
            foreach (var skin in assembler.visualRoot.GetComponentsInChildren<SkinnedMeshRenderer>(true))
            {
                var n = skin.gameObject.name;
                if (n == "Body_HEAD" || (skin.sharedMesh != null && skin.sharedMesh.name == "Body_HEAD"))
                {
                    head = skin;
                    break;
                }
            }

            if (head == null)
            {
                foreach (var skin in assembler.visualRoot.GetComponentsInChildren<SkinnedMeshRenderer>(true))
                {
                    if (skin.gameObject.name.Contains("Body_Skin") || skin.gameObject.name.Contains("HEAD"))
                    {
                        head = skin;
                        break;
                    }
                }
            }

            if (head == null || head.sharedMesh == null)
            {
                return;
            }

            if (assembler.faceBaseMesh == null)
            {
                assembler.faceBaseMesh = head.sharedMesh;
            }

            var source = assembler.faceBaseMesh;
            var mesh = Object.Instantiate(source);
            mesh.name = "Face_" + assembler.appearance.faceId;
            var verts = source.vertices;
            var bounds = source.bounds;
            var center = bounds.center;
            var ext = bounds.extents;
            var headMinY = center.y + ext.y * 0.28f;
            var combined = head.gameObject.name.Contains("Skin");
            var id = assembler.appearance.faceId;
            for (var i = 0; i < verts.Length; i++)
            {
                var v = verts[i];
                if (combined && v.y < headMinY)
                {
                    continue;
                }

                var nx = ext.x > 0.001f ? (v.x - center.x) / ext.x : 0f;
                var ny = ext.y > 0.001f ? (v.y - center.y) / Mathf.Max(ext.y * (combined ? 0.35f : 1f), 0.001f) : 0f;
                var nz = ext.z > 0.001f ? (v.z - center.z) / ext.z : 0f;
                if (id == "face_01")
                {
                    v.x = center.x + (v.x - center.x) * (1.08f + ny * 0.04f);
                    v.y += ny > 0.1f ? 0.006f : 0f;
                }
                else if (id == "face_02")
                {
                    var jaw = ny < 0.08f ? 1.42f : 1.14f;
                    v.x = center.x + (v.x - center.x) * jaw;
                    v.z = center.z + (v.z - center.z) * 1.16f;
                    if (ny < -0.1f)
                    {
                        v.y -= 0.018f;
                    }
                }
                else if (id == "face_03")
                {
                    v.x = center.x + (v.x - center.x) * (ny < 0.05f ? 0.68f : 0.86f);
                    if (ny < -0.08f)
                    {
                        v.y -= 0.034f;
                        v.z += 0.016f;
                    }

                    if (ny > 0.15f && nz > 0.02f)
                    {
                        v.z += 0.022f;
                        v.y += 0.012f;
                    }
                }

                verts[i] = v;
            }

            mesh.vertices = verts;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            head.sharedMesh = mesh;
        }

        public static void ApplyEyes(CharacterAssembler assembler)
        {
            if (assembler == null || assembler.bodySlot == null)
            {
                return;
            }

            var head = BoneMapper.FindCanonical(assembler.bodySlot, "Head");
            if (head == null)
            {
                return;
            }

            assembler.eyeLeft = EnsureEye(assembler.eyeLeft, head, "Eye_L");
            assembler.eyeRight = EnsureEye(assembler.eyeRight, head, "Eye_R");
            assembler.eyeLeft.transform.localPosition = new Vector3(-0.033f, 0.055f, 0.086f);
            assembler.eyeRight.transform.localPosition = new Vector3(0.033f, 0.055f, 0.086f);
            assembler.eyeLeft.transform.localRotation = Quaternion.identity;
            assembler.eyeRight.transform.localRotation = Quaternion.identity;
            assembler.eyeLeft.transform.localScale = Vector3.one * 0.028f;
            assembler.eyeRight.transform.localScale = Vector3.one * 0.028f;
            var tint = assembler.appearance.EyeTint();
            PaintEye(assembler.eyeLeft, tint);
            PaintEye(assembler.eyeRight, tint);
        }

        static GameObject EnsureEye(GameObject current, Transform head, string name)
        {
            if (current != null)
            {
                current.transform.SetParent(head, false);
                current.name = name;
                return current;
            }

            var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            go.name = name;
            go.transform.SetParent(head, false);
            go.transform.localScale = Vector3.one * 0.028f;
            var col = go.GetComponent<Collider>();
            if (col != null)
            {
                Object.Destroy(col);
            }

            var renderer = go.GetComponent<Renderer>();
            renderer.sharedMaterial = CharacterSharedMaterials.Eye();
            renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            return go;
        }

        static void PaintEye(GameObject eye, Color tint)
        {
            if (eye == null)
            {
                return;
            }

            var renderer = eye.GetComponent<Renderer>();
            renderer.sharedMaterial = CharacterSharedMaterials.Eye();
            var block = new MaterialPropertyBlock();
            renderer.GetPropertyBlock(block);
            block.SetColor("_BaseColor", tint);
            block.SetColor("_Color", tint);
            renderer.SetPropertyBlock(block);
        }
    }
}
