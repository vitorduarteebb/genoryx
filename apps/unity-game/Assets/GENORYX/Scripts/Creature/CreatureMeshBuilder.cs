using System;
using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Toolkit de construcao de malhas do chassi GENORYX.
    /// Tudo e autorado em espaco do CreatureRoot em pose de repouso,
    /// para que bindposes sejam identicas em todas as pecas.
    /// </summary>
    public class CreatureMeshBuilder
    {
        readonly List<Vector3> verts = new List<Vector3>();
        readonly List<Vector3> normals = new List<Vector3>();
        readonly List<Vector2> uvs = new List<Vector2>();
        readonly List<int> tris = new List<int>();

        public Func<Vector3, BoneWeight> Weighter;

        public int VertexCount => verts.Count;

        public int Add(Vector3 position, Vector2 uv)
        {
            verts.Add(position);
            uvs.Add(uv);
            normals.Add(Vector3.zero);
            return verts.Count - 1;
        }

        public void Tri(int a, int b, int c)
        {
            tris.Add(a);
            tris.Add(b);
            tris.Add(c);
        }

        public void Quad(int a, int b, int c, int d)
        {
            Tri(a, b, c);
            Tri(a, c, d);
        }

        /// <summary>Triangulo com vertices proprios (flat shading, usado em cristais).</summary>
        public void FlatTri(Vector3 a, Vector3 b, Vector3 c, Vector2 uvA, Vector2 uvB, Vector2 uvC)
        {
            var ia = Add(a, uvA);
            var ib = Add(b, uvB);
            var ic = Add(c, uvC);
            Tri(ia, ib, ic);
        }

        public void FlatQuad(Vector3 a, Vector3 b, Vector3 c, Vector3 d, float v0 = 0f, float v1 = 1f)
        {
            FlatTri(a, b, c, new Vector2(0f, v0), new Vector2(1f, v0), new Vector2(1f, v1));
            FlatTri(a, c, d, new Vector2(0f, v0), new Vector2(1f, v1), new Vector2(0f, v1));
        }

        /// <summary>Anel de vertices ao redor de um centro. Retorna o indice do primeiro vertice.</summary>
        public int Ring(Vector3 center, float halfWidth, float top, float bottom, int segments, float squareness, float v)
        {
            var first = verts.Count;
            for (var i = 0; i < segments; i++)
            {
                var t = (float)i / segments;
                var angle = t * Mathf.PI * 2f;
                var offset = SuperEllipse(angle, halfWidth, top, bottom, squareness);
                Add(new Vector3(center.x + offset.x, center.y + offset.y, center.z), new Vector2(t, v));
            }

            return first;
        }

        /// <summary>Anel circular arbitrario em um plano definido por right/up.</summary>
        public int RingOriented(Vector3 center, Vector3 right, Vector3 up, float radiusX, float radiusY, int segments, float squareness, float v)
        {
            var first = verts.Count;
            for (var i = 0; i < segments; i++)
            {
                var t = (float)i / segments;
                var angle = t * Mathf.PI * 2f;
                var offset = SuperEllipse(angle, radiusX, radiusY, radiusY, squareness);
                Add(center + right * offset.x + up * offset.y, new Vector2(t, v));
            }

            return first;
        }

        public void Bridge(int ringA, int ringB, int segments)
        {
            for (var i = 0; i < segments; i++)
            {
                var next = (i + 1) % segments;
                Quad(ringA + i, ringA + next, ringB + next, ringB + i);
            }
        }

        public void CapEnd(int ring, int segments, Vector3 center, Vector2 uv, bool flip)
        {
            var c = Add(center, uv);
            for (var i = 0; i < segments; i++)
            {
                var next = (i + 1) % segments;
                if (flip)
                {
                    Tri(c, ring + next, ring + i);
                }
                else
                {
                    Tri(c, ring + i, ring + next);
                }
            }
        }

        /// <summary>Perfil superelliptico: squareness 2 = elipse, 3+ = retangulo suavizado.</summary>
        public static Vector2 SuperEllipse(float angle, float halfWidth, float top, float bottom, float squareness)
        {
            var cos = Mathf.Cos(angle);
            var sin = Mathf.Sin(angle);
            var power = 2f / Mathf.Max(squareness, 0.5f);
            var x = Mathf.Sign(cos) * Mathf.Pow(Mathf.Abs(cos), power) * halfWidth;
            var radiusY = sin >= 0f ? top : bottom;
            var y = Mathf.Sign(sin) * Mathf.Pow(Mathf.Abs(sin), power) * radiusY;
            return new Vector2(x, y);
        }

        /// <summary>Tubo ao longo de uma polilinha, com raio por ponto. Bom para caudas e membros.</summary>
        public void Tube(IReadOnlyList<Vector3> path, IReadOnlyList<float> radii, int segments, float squareness, bool capStart, bool capEnd, float flattenY = 1f)
        {
            if (path.Count < 2)
            {
                return;
            }

            var rings = new int[path.Count];
            for (var i = 0; i < path.Count; i++)
            {
                var forward = i == 0
                    ? (path[1] - path[0]).normalized
                    : i == path.Count - 1
                        ? (path[i] - path[i - 1]).normalized
                        : (path[i + 1] - path[i - 1]).normalized;

                var up = Mathf.Abs(Vector3.Dot(forward, Vector3.up)) > 0.95f ? Vector3.forward : Vector3.up;
                var right = Vector3.Cross(up, forward).normalized;
                up = Vector3.Cross(forward, right).normalized;
                var v = (float)i / (path.Count - 1);
                rings[i] = RingOriented(path[i], right, up, radii[i], radii[i] * flattenY, segments, squareness, v);
            }

            for (var i = 0; i < path.Count - 1; i++)
            {
                Bridge(rings[i], rings[i + 1], segments);
            }

            if (capStart)
            {
                CapEnd(rings[0], segments, path[0], new Vector2(0.5f, 0f), true);
            }

            if (capEnd)
            {
                CapEnd(rings[path.Count - 1], segments, path[path.Count - 1], new Vector2(0.5f, 1f), false);
            }
        }

        /// <summary>Espigao facetado (chifre, espinho, cristal). Sempre flat shaded.</summary>
        public void Spike(Vector3 baseCenter, Vector3 direction, float length, float baseRadius, int sides, float curve, Vector3 curveAxis, float tipRadius = 0f)
        {
            direction = direction.normalized;
            var up = Mathf.Abs(Vector3.Dot(direction, Vector3.up)) > 0.95f ? Vector3.forward : Vector3.up;
            var right = Vector3.Cross(up, direction).normalized;
            up = Vector3.Cross(direction, right).normalized;

            const int rings = 4;
            var centers = new Vector3[rings + 1];
            var radii = new float[rings + 1];
            for (var i = 0; i <= rings; i++)
            {
                var t = (float)i / rings;
                var bend = curveAxis.normalized * (curve * t * t * length);
                centers[i] = baseCenter + direction * (length * t) + bend;
                radii[i] = Mathf.Lerp(baseRadius, tipRadius, Mathf.Pow(t, 0.85f));
            }

            for (var i = 0; i < rings; i++)
            {
                for (var s = 0; s < sides; s++)
                {
                    var a0 = (float)s / sides * Mathf.PI * 2f;
                    var a1 = (float)(s + 1) / sides * Mathf.PI * 2f;
                    var p0 = centers[i] + (right * Mathf.Cos(a0) + up * Mathf.Sin(a0)) * radii[i];
                    var p1 = centers[i] + (right * Mathf.Cos(a1) + up * Mathf.Sin(a1)) * radii[i];
                    var p2 = centers[i + 1] + (right * Mathf.Cos(a1) + up * Mathf.Sin(a1)) * radii[i + 1];
                    var p3 = centers[i + 1] + (right * Mathf.Cos(a0) + up * Mathf.Sin(a0)) * radii[i + 1];
                    var v0 = (float)i / rings;
                    var v1 = (float)(i + 1) / rings;
                    if (radii[i + 1] <= 0.0005f)
                    {
                        FlatTri(p0, p1, centers[i + 1], new Vector2(0f, v0), new Vector2(1f, v0), new Vector2(0.5f, v1));
                    }
                    else
                    {
                        FlatQuad(p0, p1, p2, p3, v0, v1);
                    }
                }
            }
        }

        /// <summary>Placa/escama achatada, util para back traits e armadura.</summary>
        public void Plate(Vector3 center, Vector3 forward, Vector3 up, float length, float width, float thickness, float tipTaper)
        {
            forward = forward.normalized;
            up = up.normalized;
            var right = Vector3.Cross(up, forward).normalized;
            var halfW = width * 0.5f;
            var tipW = halfW * tipTaper;
            var t = thickness * 0.5f;

            var b0 = center - right * halfW - forward * (length * 0.5f);
            var b1 = center + right * halfW - forward * (length * 0.5f);
            var t1 = center + right * tipW + forward * (length * 0.5f) + up * (length * 0.28f);
            var t0 = center - right * tipW + forward * (length * 0.5f) + up * (length * 0.28f);

            // Winding: right = cross(up, forward) faz a face +n fechar com a normal para -n.
            // Placa invertida some no backface culling e o trait dorsal aparecia como um
            // buraco no lombo, entao cada quad e emitido na ordem que aponta para fora.
            var n = up * t;
            FlatQuad(t0 + n, t1 + n, b1 + n, b0 + n);
            FlatQuad(t1 - n, t0 - n, b0 - n, b1 - n);
            FlatQuad(b0 + n, b1 + n, b1 - n, b0 - n);
            FlatQuad(t1 + n, t0 + n, t0 - n, t1 - n);
            FlatQuad(b1 + n, t1 + n, t1 - n, b1 - n);
            FlatQuad(t0 + n, b0 + n, b0 - n, t0 - n);
        }

        /// <summary>Elipsoide suave. Usado em olhos, pes e nucleos organicos.</summary>
        public void Ellipsoid(Vector3 center, Vector3 radius, int segments, int rings, float squash = 1f)
        {
            var grid = new int[rings + 1, segments];
            for (var r = 0; r <= rings; r++)
            {
                var phi = Mathf.PI * r / rings;
                var y = Mathf.Cos(phi);
                var ring = Mathf.Sin(phi);
                for (var s = 0; s < segments; s++)
                {
                    var theta = Mathf.PI * 2f * s / segments;
                    var local = new Vector3(
                        Mathf.Cos(theta) * ring * radius.x,
                        y * radius.y * (y < 0f ? squash : 1f),
                        Mathf.Sin(theta) * ring * radius.z);
                    grid[r, s] = Add(center + local, new Vector2((float)s / segments, 1f - (float)r / rings));
                }
            }

            for (var r = 0; r < rings; r++)
            {
                for (var s = 0; s < segments; s++)
                {
                    var next = (s + 1) % segments;
                    Quad(grid[r, s], grid[r, next], grid[r + 1, next], grid[r + 1, s]);
                }
            }
        }

        public Mesh Build(string name, Matrix4x4[] bindposes)
        {
            var mesh = new Mesh { name = name };
            if (verts.Count > 65000)
            {
                mesh.indexFormat = UnityEngine.Rendering.IndexFormat.UInt32;
            }

            mesh.SetVertices(verts);
            mesh.SetUVs(0, uvs);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateNormals();
            mesh.RecalculateTangents();

            if (Weighter != null && bindposes != null)
            {
                var weights = new BoneWeight[verts.Count];
                for (var i = 0; i < verts.Count; i++)
                {
                    weights[i] = Weighter(verts[i]);
                }

                mesh.boneWeights = weights;
                mesh.bindposes = bindposes;
            }

            mesh.RecalculateBounds();
            mesh.UploadMeshData(false);
            return mesh;
        }

        public static BoneWeight Single(int bone)
        {
            return new BoneWeight { boneIndex0 = bone, weight0 = 1f };
        }

        public static BoneWeight Blend(int boneA, float weightA, int boneB, float weightB)
        {
            var total = weightA + weightB;
            if (total <= 0.0001f)
            {
                return Single(boneA);
            }

            return new BoneWeight
            {
                boneIndex0 = boneA,
                weight0 = weightA / total,
                boneIndex1 = boneB,
                weight1 = weightB / total
            };
        }
    }
}
