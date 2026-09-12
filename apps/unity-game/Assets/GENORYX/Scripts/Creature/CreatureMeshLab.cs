using System.Collections.Generic;
using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Producao das malhas do GENORYX_CORE_CHASSIS_V1.
    ///
    /// Convencao critica:
    ///   - Pecas SKINADAS (Body, Head, Limbs, Tail) sao autoradas em espaco do CreatureRoot
    ///     e carregam bindposes canonicas.
    ///   - Pecas RIGIDAS (Eyes, Horns, Back, Core) sao autoradas em espaco LOCAL do socket
    ///     e apenas parenteadas ao bone.
    ///
    /// Todas as malhas sao cacheadas por chave. Trocar peca nunca aloca geometria nova.
    /// </summary>
    public static class CreatureMeshLab
    {
        static readonly Dictionary<string, Mesh> Cache = new Dictionary<string, Mesh>();

        public static int CachedMeshCount => Cache.Count;

        public static void ClearCache()
        {
            foreach (var mesh in Cache.Values)
            {
                if (mesh != null)
                {
                    Object.DestroyImmediate(mesh);
                }
            }

            Cache.Clear();
        }

        static Mesh Cached(string key, System.Func<Mesh> factory)
        {
            if (Cache.TryGetValue(key, out var mesh) && mesh != null)
            {
                return mesh;
            }

            mesh = factory();
            mesh.hideFlags = HideFlags.DontSave;
            Cache[key] = mesh;
            return mesh;
        }

        static int Seg(int baseCount, float detail)
        {
            return Mathf.Max(6, Mathf.RoundToInt(baseCount * Mathf.Clamp(detail, 0.2f, 1f)));
        }

        // ---------------------------------------------------------------- BODY

        struct Slice
        {
            public float z;
            public float halfWidth;
            public float topY;
            public float bottomY;
            public float squareness;

            public Slice(float z, float halfWidth, float topY, float bottomY, float squareness)
            {
                this.z = z;
                this.halfWidth = halfWidth;
                this.topY = topY;
                this.bottomY = bottomY;
                this.squareness = squareness;
            }
        }

        /// <summary>
        /// Silhueta canonica do chassi, amostrada de tras para frente.
        ///
        /// Um unico perfil descreve corpo E cabeca, entao a curva do dorso desce de forma
        /// continua do lombo alto ate o focinho baixo, como na referencia, e as quatro
        /// cabecas compartilham exatamente a secao da fronteira.
        ///
        /// Tres leituras importam nestes numeros:
        ///   0.785 de comprimento por 0.552 de altura por 0.584 de largura, ou seja
        ///     1.42 x altura e 0.74 x comprimento, que e a proporcao da spec;
        ///   cabeca quase tao LARGA quanto o corpo (0.50 contra 0.58), senao o flanco
        ///     a esconde e a vista frontal fica sem cara;
        ///   focinho em 0.345, nao 0.400: projetada 24cm alem do tronco a cabeca ficava
        ///     pendurada na frente das pernas e a criatura lia como duas bolhas;
        ///   barriga em 0.148 na faixa das pernas — bloco baixo e robusto, nao pernalta.
        /// </summary>
        static readonly Slice[] Silhouette =
        {
            new Slice(-0.440f, 0.082f, 0.352f, 0.246f, 2.05f),
            new Slice(-0.410f, 0.156f, 0.428f, 0.212f, 2.20f),
            new Slice(-0.360f, 0.228f, 0.492f, 0.180f, 2.36f),
            new Slice(-0.300f, 0.268f, 0.528f, 0.161f, 2.46f),
            new Slice(-0.220f, 0.285f, 0.548f, 0.151f, 2.52f),
            new Slice(-0.140f, 0.292f, 0.552f, 0.148f, 2.54f),
            new Slice(-0.055f, 0.287f, 0.542f, 0.148f, 2.52f),
            new Slice(0.020f, 0.276f, 0.522f, 0.150f, 2.48f),
            new Slice(0.090f, 0.262f, 0.498f, 0.148f, 2.44f),
            new Slice(0.160f, 0.248f, 0.472f, 0.146f, 2.40f),
            new Slice(0.214f, 0.236f, 0.446f, 0.141f, 2.34f),
            new Slice(0.264f, 0.214f, 0.416f, 0.133f, 2.24f),
            new Slice(0.303f, 0.178f, 0.386f, 0.126f, 2.14f),
            new Slice(0.331f, 0.124f, 0.352f, 0.122f, 2.06f),
            new Slice(0.345f, 0.062f, 0.324f, 0.132f, 2.00f)
        };

        static readonly Slice[] BodyProfile = Silhouette;

        /// <summary>
        /// Secao transversal do corpo em Z, no espaco autorado do CreatureRoot.
        /// Publica porque o validador precisa da superficie EXATA: qualquer aproximacao
        /// binada superestima o raio em secoes achatadas e reprova pecas corretas.
        /// </summary>
        public static void BodySection(float z, out Vector3 center, out float halfWidth,
            out float halfHeight, out float squareness)
        {
            var s = Sample(Silhouette, Mathf.Clamp(z, CreatureChassisSpec.BodyRearZ, CreatureChassisSpec.BodyFrontZ));
            center = new Vector3(0f, (s.topY + s.bottomY) * 0.5f, z);
            halfWidth = s.halfWidth;
            halfHeight = (s.topY - s.bottomY) * 0.5f;
            squareness = s.squareness;
        }

        /// <summary>
        /// Secao transversal da cabeca em Z, replicando exatamente as mesmas contas
        /// que <see cref="Head"/> usa para gerar os aneis, inclusive o estilo.
        /// </summary>
        public static void HeadSection(string headId, float z, out Vector3 center, out float halfWidth,
            out float halfHeight, out float squareness)
        {
            HeadSlice(StyleForHead(headId), z, out center, out halfWidth, out halfHeight, out squareness);
        }

        /// <summary>
        /// Faixa de Z da pele VISIVEL da cabeca. Comeca na fronteira com o corpo, nao no
        /// recuo interno: aquele trecho esta submerso e nao responde por superficie.
        /// </summary>
        public static void HeadRange(string headId, out float minZ, out float maxZ)
        {
            var style = StyleForHead(headId);
            var snoutBreak = CreatureChassisSpec.BodyFrontZ;
            minZ = snoutBreak;
            maxZ = snoutBreak + (CreatureChassisSpec.NoseZ - snoutBreak) * style.snout;
        }

        static Slice Sample(Slice[] profile, float z)
        {
            if (z <= profile[0].z)
            {
                return profile[0];
            }

            if (z >= profile[profile.Length - 1].z)
            {
                return profile[profile.Length - 1];
            }

            for (var i = 0; i < profile.Length - 1; i++)
            {
                if (z <= profile[i + 1].z)
                {
                    return new Slice(
                        z,
                        Mathf.Max(Spline(profile, i, z, static s => s.halfWidth), 0.004f),
                        Spline(profile, i, z, static s => s.topY),
                        Spline(profile, i, z, static s => s.bottomY),
                        Mathf.Max(Spline(profile, i, z, static s => s.squareness), 1.05f));
                }
            }

            return profile[profile.Length - 1];
        }

        /// <summary>
        /// Hermite cubica no intervalo [i, i+1], com tangentes por diferenca finita EM Z.
        ///
        /// Interpolar por smoothstep dentro de cada intervalo zerava a derivada em todo no
        /// do perfil, e a pele ganhava um patamar por slice: a criatura aparecia listrada
        /// de aneis concentricos no dorso. Catmull-Rom uniforme nao resolve porque os nos
        /// nao sao equidistantes em Z — a tangente saltaria na fronteira do intervalo.
        /// Dividindo pelo Z real a curva fica C1 de verdade e o dorso sai liso.
        /// </summary>
        static float Spline(Slice[] profile, int i, float z, System.Func<Slice, float> field)
        {
            var b = profile[i];
            var c = profile[i + 1];
            var a = profile[Mathf.Max(i - 1, 0)];
            var d = profile[Mathf.Min(i + 2, profile.Length - 1)];

            var h = c.z - b.z;
            var mb = c.z - a.z > 1e-6f ? (field(c) - field(a)) / (c.z - a.z) : 0f;
            var mc = d.z - b.z > 1e-6f ? (field(d) - field(b)) / (d.z - b.z) : 0f;

            var t = (z - b.z) / h;
            var t2 = t * t;
            var t3 = t2 * t;

            return (2f * t3 - 3f * t2 + 1f) * field(b)
                + (t3 - 2f * t2 + t) * h * mb
                + (-2f * t3 + 3f * t2) * field(c)
                + (t3 - t2) * h * mc;
        }

        public static Mesh Body(string bodyId, float detail = 1f)
        {
            return Cached("body:" + bodyId + ":" + detail, () =>
            {
                var around = Seg(24, detail);
                var along = Seg(22, detail);
                var b = new CreatureMeshBuilder { Weighter = BodyWeight };

                var rings = new int[along + 1];
                for (var i = 0; i <= along; i++)
                {
                    var t = (float)i / along;
                    var z = Mathf.Lerp(CreatureChassisSpec.BodyRearZ, CreatureChassisSpec.BodyFrontZ, t);
                    var s = Sample(BodyProfile, z);
                    var center = new Vector3(0f, (s.topY + s.bottomY) * 0.5f, z);
                    var up = (s.topY - s.bottomY) * 0.5f;
                    rings[i] = b.Ring(center, s.halfWidth, up, up, around, s.squareness, t);
                }

                for (var i = 0; i < along; i++)
                {
                    b.Bridge(rings[i], rings[i + 1], around);
                }

                var rear = Sample(BodyProfile, CreatureChassisSpec.BodyRearZ);
                b.CapEnd(rings[0], around, new Vector3(0f, (rear.topY + rear.bottomY) * 0.5f, CreatureChassisSpec.BodyRearZ - 0.018f), new Vector2(0.5f, 0f), true);

                // Tampa frontal PLANA na fronteira: a base da cabeca coincide com este anel,
                // entao a tampa fica escondida. Abaulada para frente ela furava a cabeca,
                // que a partir daqui afina em direcao ao focinho.
                //
                // Ela ganha um anel PROPRIO, duplicado na mesma posicao, em vez de reusar o
                // anel visivel. Reusando, a normal do ultimo anel do corpo virava a media
                // entre a parede lateral e a tampa (que aponta para +Z), e essa quebra de
                // iluminacao desenhava um colar escuro no pescoco mesmo com a geometria
                // perfeitamente continua.
                var front = Sample(BodyProfile, CreatureChassisSpec.BodyFrontZ);
                var frontCenter = new Vector3(0f, (front.topY + front.bottomY) * 0.5f, CreatureChassisSpec.BodyFrontZ);
                var frontUp = (front.topY - front.bottomY) * 0.5f;
                var capRing = b.Ring(frontCenter, front.halfWidth, frontUp, frontUp, around, front.squareness, 1f);
                b.CapEnd(capRing, around, frontCenter, new Vector2(0.5f, 1f), false);

                return b.Build("GENORYX_BODY_" + bodyId, CreatureRig.Bindposes());
            });
        }

        static BoneWeight BodyWeight(Vector3 p)
        {
            var body = CreatureSockets.Index(CreatureSockets.Body);
            var head = CreatureSockets.Index(CreatureSockets.Head);
            var tail = CreatureSockets.Index(CreatureSockets.TailRoot);

            var toHead = Mathf.InverseLerp(CreatureChassisSpec.HeadStartZ, CreatureChassisSpec.BodyFrontZ, p.z);
            if (toHead > 0f)
            {
                return CreatureMeshBuilder.Blend(body, 1f - 0.45f * toHead, head, 0.45f * toHead);
            }

            var toTail = Mathf.InverseLerp(-0.310f, CreatureChassisSpec.BodyRearZ, p.z);
            if (toTail > 0f)
            {
                return CreatureMeshBuilder.Blend(body, 1f - 0.32f * toTail, tail, 0.32f * toTail);
            }

            return CreatureMeshBuilder.Single(body);
        }

        // ---------------------------------------------------------------- HEAD

        struct HeadStyle
        {
            public float snout;
            public float cranium;
            public float width;
            public float squareness;
            public float brow;
            public float jaw;
        }

        static HeadStyle StyleForHead(string id)
        {
            return id switch
            {
                "HEAD_02_PREDATOR" => new HeadStyle { snout = 1.10f, cranium = 1.04f, width = 0.95f, squareness = 2.75f, brow = 0.030f, jaw = 1.22f },
                "HEAD_03_DRACONIC" => new HeadStyle { snout = 1.06f, cranium = 1.18f, width = 0.97f, squareness = 3.20f, brow = 0.038f, jaw = 1.10f },
                "HEAD_04_ARCANE" => new HeadStyle { snout = 0.88f, cranium = 1.30f, width = 1.06f, squareness = 2.05f, brow = 0.010f, jaw = 0.94f },
                // Cranio abobadado e queixo cheio. Com cranium = 1.00 a cabeca era
                // literalmente a curva do tronco seguindo em frente, e de perfil a criatura
                // lia como peixe-boi: sem cabeca identificavel. O StyleBlend faz esse volume
                // crescer ao longo de 12cm depois da emenda, entao o pescoco fica continuo.
                _ => new HeadStyle { snout = 1.00f, cranium = 1.16f, width = 1.04f, squareness = 2.26f, brow = 0.018f, jaw = 1.08f }
            };
        }

        /// <summary>
        /// Sino suave em 1 no centro e 0 nas bordas, com derivada nula nas duas pontas.
        /// Deriva zero importa: um sino linear deixaria vinco de shading na borda do bump.
        /// </summary>
        static float Bump(float x, float center, float halfWidth)
        {
            var t = Mathf.Clamp01(1f - Mathf.Abs(x - center) / halfWidth);
            return t * t * (3f - 2f * t);
        }

        /// <summary>
        /// Peso do estilo ao longo da cabeca. Vale 0 na emenda com o corpo e cresce para 1
        /// depois de BodyFrontZ. Consequencia: as 4 cabecas compartilham exatamente a mesma
        /// secao transversal na faixa sobreposta, entao nenhuma delas cria degrau no dorso.
        /// </summary>
        static float StyleBlend(float z)
        {
            // Comeca EM BodyFrontZ, nao antes: na emenda a cabeca precisa ter exatamente a
            // secao do corpo, senao o estilo ja alterou largura e squareness ali e aparece
            // um degrau anelar no pescoco, que nenhuma suavizacao de normal disfarca.
            var t = Mathf.InverseLerp(CreatureChassisSpec.BodyFrontZ, CreatureChassisSpec.BodyFrontZ + 0.120f, z);
            return t * t * (3f - 2f * t);
        }

        /// <summary>
        /// Secao da cabeca em Z. Unica fonte de verdade: a malha, o validador e o
        /// reassentamento das pecas rigidas leem daqui, senao divergem.
        ///
        /// Atras de BodyFrontZ a secao encolhe (<see cref="CreatureChassisSpec.HeadTuckZ"/>):
        /// esse trecho vive DENTRO do corpo, tapando a fenda que apareceria ao girar o
        /// bone da cabeca, sem competir com a pele do corpo pela superficie visivel.
        /// </summary>
        static void HeadSlice(HeadStyle style, float z, out Vector3 center, out float halfWidth,
            out float halfHeight, out float squareness)
        {
            var snoutBreak = CreatureChassisSpec.BodyFrontZ;

            // Estilo alonga/encurta so o focinho; o cranio mantem o contrato do dorso.
            var source = z <= snoutBreak
                ? z
                : snoutBreak + (z - snoutBreak) / Mathf.Max(style.snout, 0.05f);

            var s = Sample(Silhouette, source);
            var k = StyleBlend(z);

            // Cupula do cranio e volume do queixo entram como BUMP local, nao como escala
            // em torno do pivo. Escalando, perto do focinho (topY - pivo) e pequeno e a
            // cabeca mais alta so ganhava 9mm sobre a mais baixa — invisivel: de perfil a
            // criatura lia como peixe-boi, sem cabeca identificavel. O bump entrega
            // centimetros onde importa e continua zerado na emenda, via k.
            var dome = Bump(source, 0.226f, 0.112f);
            var top = s.topY + (style.cranium - 1f) * 0.34f * dome * k;
            var bottom = s.bottomY - (style.jaw - 1f) * 0.24f * dome * k;

            if (style.brow > 0f)
            {
                top += style.brow * Bump(source, 0.198f, 0.064f) * k;
            }

            var tuck = z >= snoutBreak
                ? 1f
                : Mathf.Lerp(0.88f, 1f, Mathf.InverseLerp(CreatureChassisSpec.HeadStartZ, snoutBreak, z));

            center = new Vector3(0f, (top + bottom) * 0.5f, z);
            halfWidth = s.halfWidth * Mathf.Lerp(1f, style.width, k) * tuck;
            halfHeight = (top - bottom) * 0.5f * tuck;
            squareness = Mathf.Lerp(s.squareness, style.squareness, k);
        }

        public static Mesh Head(string headId, float detail = 1f)
        {
            return Cached("head:" + headId + ":" + detail, () =>
            {
                var style = StyleForHead(headId);

                // MESMO numero de segmentos do corpo. Com 22 contra 24, os aneis nao casam na
                // emenda e a borda da tampa frontal do corpo fica exposta como um degrau
                // anelar no pescoco, por mais que as secoes coincidam matematicamente.
                var around = Seg(24, detail);
                var along = Seg(16, detail);
                var b = new CreatureMeshBuilder { Weighter = HeadWeight };

                var startZ = CreatureChassisSpec.HeadStartZ;
                var noseZ = CreatureChassisSpec.NoseZ;
                var snoutBreak = CreatureChassisSpec.BodyFrontZ;
                var endZ = snoutBreak + (noseZ - snoutBreak) * style.snout;

                // Um anel cai EXATAMENTE em BodyFrontZ. Sem ele, a interpolacao linear entre
                // dois aneis vizinhos passa por dentro da curva justamente onde o corpo
                // termina, e a cabeca nasce afundada em relacao ao tronco.
                var slices = new List<float>();
                const int neckSteps = 3;
                for (var i = 0; i < neckSteps; i++)
                {
                    slices.Add(Mathf.Lerp(startZ, snoutBreak, (float)i / neckSteps));
                }

                for (var i = 0; i <= along; i++)
                {
                    slices.Add(Mathf.Lerp(snoutBreak, endZ, (float)i / along));
                }

                var rings = new int[slices.Count];
                for (var i = 0; i < slices.Count; i++)
                {
                    var z = slices[i];
                    HeadSlice(style, z, out var center, out var halfWidth, out var halfHeight, out var squareness);
                    rings[i] = b.Ring(center, halfWidth, halfHeight, halfHeight, around, squareness,
                        (float)i / (slices.Count - 1));
                }

                for (var i = 0; i < rings.Length - 1; i++)
                {
                    b.Bridge(rings[i], rings[i + 1], around);
                }

                // A tampa traseira fica ENTERRADA no corpo: nunca aparece na silhueta.
                HeadSlice(style, startZ, out var neck, out _, out _, out _);
                b.CapEnd(rings[0], around, new Vector3(0f, neck.y, startZ - 0.014f), new Vector2(0.5f, 0f), true);

                HeadSlice(style, endZ, out var tip, out _, out _, out _);
                b.CapEnd(rings[rings.Length - 1], around, new Vector3(0f, tip.y, endZ + 0.008f), new Vector2(0.5f, 1f), false);

                return b.Build("GENORYX_HEAD_" + headId, CreatureRig.Bindposes());
            });
        }

        static BoneWeight HeadWeight(Vector3 p)
        {
            var head = CreatureSockets.Index(CreatureSockets.Head);
            var body = CreatureSockets.Index(CreatureSockets.Body);

            // Na faixa sobreposta a cabeca segue o corpo, senao a emenda abre ao animar.
            var toBody = Mathf.InverseLerp(CreatureChassisSpec.BodyFrontZ, CreatureChassisSpec.HeadStartZ, p.z);
            if (toBody > 0f)
            {
                return CreatureMeshBuilder.Blend(head, 1f - 0.90f * toBody, body, 0.90f * toBody);
            }

            return CreatureMeshBuilder.Single(head);
        }

        // --------------------------------------------------------------- LIMBS

        struct LimbStyle
        {
            public float thickness;
            public float squareness;
            public float footScale;
            public float taper;
            public bool claws;
            public bool plates;
        }

        static LimbStyle StyleForLimb(string id)
        {
            return id switch
            {
                "LIMBS_02_ARMORED" => new LimbStyle { thickness = 1.12f, squareness = 3.0f, footScale = 1.08f, taper = 0.30f, claws = false, plates = true },
                "LIMBS_03_DRACONIC" => new LimbStyle { thickness = 1.02f, squareness = 2.6f, footScale = 1.04f, taper = 0.50f, claws = true, plates = false },
                "LIMBS_04_AGILE" => new LimbStyle { thickness = 0.86f, squareness = 2.2f, footScale = 0.94f, taper = 0.82f, claws = true, plates = false },
                "LIMBS_05_HEAVY" => new LimbStyle { thickness = 1.26f, squareness = 2.8f, footScale = 1.18f, taper = 0.10f, claws = false, plates = true },
                _ => new LimbStyle { thickness = 1.00f, squareness = 2.3f, footScale = 1.00f, taper = 0.42f, claws = false, plates = false }
            };
        }

        /// <summary>Um unico SkinnedMeshRenderer contendo as quatro pernas.</summary>
        public static Mesh Limbs(string limbsId, float detail = 1f)
        {
            return Cached("limbs:" + limbsId + ":" + detail, () =>
            {
                var style = StyleForLimb(limbsId);
                var around = Seg(12, detail);
                var b = new CreatureMeshBuilder { Weighter = LimbWeight };

                BuildLeg(b, style, around, -CreatureChassisSpec.FrontLimbX, CreatureChassisSpec.FrontLimbZ, true, detail);
                BuildLeg(b, style, around, CreatureChassisSpec.FrontLimbX, CreatureChassisSpec.FrontLimbZ, true, detail);
                BuildLeg(b, style, around, -CreatureChassisSpec.RearLimbX, CreatureChassisSpec.RearLimbZ, false, detail);
                BuildLeg(b, style, around, CreatureChassisSpec.RearLimbX, CreatureChassisSpec.RearLimbZ, false, detail);

                return b.Build("GENORYX_LIMBS_" + limbsId, CreatureRig.Bindposes());
            });
        }

        /// <summary>
        /// Perna curta e robusta com o pe fazendo parte do MESMO tubo.
        /// Pe como elipsoide separado criava um degrau tipo meia; a referencia
        /// mostra a pata como alargamento continuo da perna.
        /// </summary>
        static void BuildLeg(CreatureMeshBuilder b, LimbStyle style, int around, float x, float z, bool front, float detail)
        {
            var lean = front ? 0.012f : -0.014f;
            var baseRadius = 0.112f * style.thickness;

            // (altura, raio relativo). Com a barriga a 0.148, o vao livre e de 14cm para uma
            // perna de 11cm de raio: e isso que a referencia mostra — pata curta e grossa,
            // nao pernalta. O topo em 0.236 nasce 9cm DENTRO da carne, o que apaga a juncao.
            var shape = new[]
            {
                // A queda no meio fica MODERADA: com 0.82 a perna ganhava cintura de
                // ampulheta e lia como osso. Pata robusta quer perfil quase cilindrico.
                (0.236f, 0.94f),
                (0.196f, 1.01f),
                (0.162f, 1.00f),
                (0.128f, Mathf.Lerp(0.99f, 0.92f, style.taper)),
                (0.094f, Mathf.Lerp(0.99f, 0.90f, style.taper)),
                (0.062f, Mathf.Lerp(1.03f, 0.95f, style.taper)),

                // Pata: alarga e depois FECHA numa sola arredondada. Terminar no ponto mais
                // largo produzia um disco chapado; a queda final e o que da o volume de
                // pata larga e simples da referencia.
                (0.036f, Mathf.Lerp(1.10f, 0.98f, style.taper) * style.footScale),
                (0.014f, Mathf.Lerp(1.04f, 0.92f, style.taper) * style.footScale),
                (0.004f, Mathf.Lerp(0.74f, 0.66f, style.taper) * style.footScale)
            };

            var path = new List<Vector3>();
            var radii = new List<float>();
            for (var i = 0; i < shape.Length; i++)
            {
                var (y, scale) = shape[i];
                var t = 1f - Mathf.InverseLerp(0.004f, 0.236f, y);
                path.Add(new Vector3(x, y, z + lean * t));
                radii.Add(baseRadius * scale);
            }

            b.Tube(path, radii, around, style.squareness, true, true);

            if (style.claws)
            {
                var footZ = z + lean;
                for (var i = -1; i <= 1; i++)
                {
                    var cx = x + i * baseRadius * 0.46f;
                    var cz = footZ + (front ? baseRadius * 0.92f : -baseRadius * 0.92f);
                    var dir = new Vector3(i * 0.18f, -0.16f, front ? 1f : -1f);
                    b.Spike(new Vector3(cx, 0.036f, cz), dir, 0.034f, 0.010f, 4, 0.12f, Vector3.down);
                }
            }

            if (style.plates)
            {
                b.Plate(new Vector3(x + Mathf.Sign(x) * baseRadius * 0.66f, 0.178f, z),
                    Vector3.up, new Vector3(Mathf.Sign(x), 0f, 0f), 0.066f, 0.062f, 0.011f, 0.72f);
            }
        }

        static BoneWeight LimbWeight(Vector3 p)
        {
            var front = p.z > (CreatureChassisSpec.FrontLimbZ + CreatureChassisSpec.RearLimbZ) * 0.5f;
            var left = p.x < 0f;

            var limb = CreatureSockets.Index(front
                ? left ? CreatureSockets.FrontLimbL : CreatureSockets.FrontLimbR
                : left ? CreatureSockets.RearLimbL : CreatureSockets.RearLimbR);
            var foot = CreatureSockets.Index(front
                ? left ? CreatureSockets.FrontFootL : CreatureSockets.FrontFootR
                : left ? CreatureSockets.RearFootL : CreatureSockets.RearFootR);
            var body = CreatureSockets.Index(CreatureSockets.Body);

            var toBody = Mathf.InverseLerp(0.200f, 0.268f, p.y);
            if (toBody > 0f)
            {
                return CreatureMeshBuilder.Blend(limb, 1f - 0.70f * toBody, body, 0.70f * toBody);
            }

            var toFoot = Mathf.InverseLerp(0.100f, 0.045f, p.y);
            if (toFoot > 0f)
            {
                return CreatureMeshBuilder.Blend(limb, 1f - toFoot, foot, toFoot);
            }

            return CreatureMeshBuilder.Single(limb);
        }

        // ---------------------------------------------------------------- TAIL

        struct TailStyle
        {
            public float length;
            public float thickness;
            public float taper;
            public float lift;
            public int spikes;
            public bool crystalTip;
            public float squareness;
        }

        static TailStyle StyleForTail(string id)
        {
            return id switch
            {
                "TAIL_02_CURVED" => new TailStyle { length = 1.00f, thickness = 0.92f, taper = 0.34f, lift = 0.075f, spikes = 0, crystalTip = false, squareness = 2.2f },
                "TAIL_03_SPIKED" => new TailStyle { length = 1.02f, thickness = 1.00f, taper = 0.40f, lift = 0.030f, spikes = 5, crystalTip = false, squareness = 2.5f },
                "TAIL_04_SERPENT" => new TailStyle { length = 1.62f, thickness = 0.78f, taper = 0.18f, lift = 0.045f, spikes = 0, crystalTip = false, squareness = 2.1f },
                "TAIL_05_ELEMENTAL" => new TailStyle { length = 1.14f, thickness = 0.88f, taper = 0.30f, lift = 0.090f, spikes = 0, crystalTip = true, squareness = 2.3f },
                // 0.62 de comprimento rendia 13cm: lia como toco, nao como cauda curta.
                _ => new TailStyle { length = 0.92f, thickness = 1.24f, taper = 0.42f, lift = 0.018f, spikes = 0, crystalTip = false, squareness = 2.4f }
            };
        }

        public static Mesh Tail(string tailId, float detail = 1f)
        {
            return Cached("tail:" + tailId + ":" + detail, () =>
            {
                var style = StyleForTail(tailId);
                var around = Seg(12, detail);
                var b = new CreatureMeshBuilder { Weighter = TailWeight };

                var root = CreatureRig.RestWorld(CreatureSockets.TailRoot);
                var chain = CreatureChassisSpec.TailSegment * 2f;
                var total = chain * style.length;
                var steps = Mathf.Max(5, Seg(9, detail));

                var path = new List<Vector3>();
                var radii = new List<float>();
                var baseRadius = 0.072f * style.thickness;

                for (var i = 0; i <= steps; i++)
                {
                    var t = (float)i / steps;
                    var dist = total * t;
                    var y = root.y + style.lift * Mathf.Sin(t * Mathf.PI * 0.85f) + 0.020f * t;
                    path.Add(new Vector3(0f, y, root.z - dist));
                    radii.Add(Mathf.Lerp(baseRadius, baseRadius * style.taper, Mathf.Pow(t, 0.75f)));
                }

                b.Tube(path, radii, around, style.squareness, true, !style.crystalTip);

                if (style.spikes > 0)
                {
                    for (var i = 0; i < style.spikes; i++)
                    {
                        var t = Mathf.Lerp(0.25f, 0.94f, (float)i / Mathf.Max(1, style.spikes - 1));
                        var index = Mathf.Clamp(Mathf.RoundToInt(t * steps), 0, steps);
                        var p = path[index];
                        var r = radii[index];
                        b.Spike(new Vector3(0f, p.y + r * 0.72f, p.z), new Vector3(0f, 0.86f, 0.51f), 0.052f * (1.15f - t * 0.4f), 0.015f, 4, 0.1f, Vector3.back);
                    }
                }

                if (style.crystalTip)
                {
                    var tip = path[steps];
                    for (var i = 0; i < 3; i++)
                    {
                        var angle = -35f + i * 35f;
                        var dir = Quaternion.Euler(angle, 0f, 0f) * new Vector3(0f, 0.42f, -0.91f);
                        b.Spike(tip, dir, 0.088f, 0.020f, 5, 0.05f, Vector3.up);
                    }
                }

                return b.Build("GENORYX_TAIL_" + tailId, CreatureRig.Bindposes());
            });
        }

        static BoneWeight TailWeight(Vector3 p)
        {
            var body = CreatureSockets.Index(CreatureSockets.Body);
            var root = CreatureSockets.Index(CreatureSockets.TailRoot);
            var mid = CreatureSockets.Index(CreatureSockets.TailMid);
            var tip = CreatureSockets.Index(CreatureSockets.TailTip);

            var rootZ = CreatureRig.RestWorld(CreatureSockets.TailRoot).z;
            var midZ = CreatureRig.RestWorld(CreatureSockets.TailMid).z;
            var tipZ = CreatureRig.RestWorld(CreatureSockets.TailTip).z;

            if (p.z >= rootZ)
            {
                var toBody = Mathf.InverseLerp(rootZ, rootZ + 0.045f, p.z);
                return CreatureMeshBuilder.Blend(root, 1f - 0.5f * toBody, body, 0.5f * toBody);
            }

            if (p.z >= midZ)
            {
                var t = Mathf.InverseLerp(rootZ, midZ, p.z);
                return CreatureMeshBuilder.Blend(root, 1f - t, mid, t);
            }

            var u = Mathf.Clamp01(Mathf.InverseLerp(midZ, tipZ, p.z));
            return CreatureMeshBuilder.Blend(mid, 1f - u, tip, u);
        }

        // ------------------------------------------------- PECAS RIGIDAS (LOCAL)

        public static Mesh Eye(string eyesId, float detail = 1f)
        {
            return Cached("eye:" + eyesId + ":" + detail, () =>
            {
                var b = new CreatureMeshBuilder();

                // X e a normal aproximada da face nesta altura: manter X pequeno faz a
                // peca ler como lente amendoada em vez de bola grudada.
                var radius = eyesId switch
                {
                    "EYES_01_PREDATOR" => new Vector3(0.030f, 0.026f, 0.062f),
                    "EYES_02_AZURE" => new Vector3(0.032f, 0.041f, 0.048f),
                    "EYES_03_AMBER" => new Vector3(0.031f, 0.036f, 0.052f),
                    "EYES_04_NATURE" => new Vector3(0.030f, 0.038f, 0.044f),
                    "EYES_05_VOID" => new Vector3(0.033f, 0.044f, 0.056f),
                    _ => new Vector3(0.031f, 0.036f, 0.052f)
                };

                // Centrada no socket, sem offset lateral. O socket direito e espelhado em X,
                // entao qualquer offset em X afundaria um olho e faria o outro saltar.
                // Quem controla o quanto a lente afunda e EyeX no contrato do chassi.
                b.Ellipsoid(Vector3.zero, radius, Seg(16, detail), Seg(11, detail));
                return b.Build("GENORYX_EYE_" + eyesId, null);
            });
        }

        public static Mesh Horn(string hornsId, float detail = 1f)
        {
            if (hornsId == CreatureParts.HornsNone)
            {
                return null;
            }

            return Cached("horn:" + hornsId + ":" + detail, () =>
            {
                var b = new CreatureMeshBuilder();
                switch (hornsId)
                {
                    // Chifre curvo puxado para tras: o -Z precisa ficar moderado. Com -0.47 o
                    // chifre corria RENTE ao cranio, que sobe na mesma direcao, e a ponta
                    // reentrava na carne. Menos inclinacao e mais comprimento resolvem.
                    case "HORNS_02_DARK":
                        b.Spike(Vector3.zero, new Vector3(0f, 0.93f, -0.28f), 0.152f, 0.032f, 6, 0.34f, Vector3.back);
                        break;
                    case "HORNS_03_CRYSTAL":
                        b.Spike(Vector3.zero, new Vector3(0f, 0.98f, -0.16f), 0.158f, 0.025f, 5, 0.06f, Vector3.back);
                        b.Spike(new Vector3(0f, 0.030f, -0.012f), new Vector3(0.40f, 0.90f, -0.18f), 0.104f, 0.013f, 5, 0.04f, Vector3.back);
                        break;
                    case "HORNS_04_INFERNAL":
                        b.Spike(Vector3.zero, new Vector3(0f, 0.94f, -0.30f), 0.176f, 0.030f, 6, 0.24f, Vector3.back);

                        // Farpas apontam para FORA e para cima. Apontando quase puro -Z elas
                        // corriam rentes ao cranio e nao liam como serrilhado.
                        for (var i = 0; i < 3; i++)
                        {
                            var t = 0.26f + i * 0.22f;
                            b.Spike(new Vector3(0f, 0.176f * t, -0.044f * t), new Vector3(0.42f, 0.62f, -0.66f), 0.046f - i * 0.007f, 0.010f, 4, 0.1f, Vector3.up);
                        }

                        break;
                    case "HORNS_05_VOID_CRYSTAL":
                        b.Spike(Vector3.zero, new Vector3(0f, 0.98f, -0.14f), 0.168f, 0.022f, 5, 0.02f, Vector3.back);
                        b.Spike(new Vector3(0.020f, 0.018f, -0.008f), new Vector3(0.46f, 0.88f, -0.10f), 0.112f, 0.015f, 5, 0.02f, Vector3.back);
                        b.Spike(new Vector3(-0.018f, 0.014f, -0.014f), new Vector3(-0.40f, 0.90f, -0.18f), 0.094f, 0.014f, 5, 0.02f, Vector3.back);
                        break;
                    // HORNS_01_BONE: cone osseo simples. Curva discreta, senao ele deita
                    // sobre o cranio e deixa de ler como chifre em camera 3/4.
                    default:
                        b.Spike(Vector3.zero, new Vector3(0f, 0.96f, -0.22f), 0.148f, 0.027f, 6, 0.14f, Vector3.back);
                        break;
                }

                return b.Build("GENORYX_HORN_" + hornsId, null);
            });
        }

        public static Mesh BackTrait(string backId, float detail = 1f)
        {
            if (backId == CreatureParts.BackNone)
            {
                return null;
            }

            return Cached("back:" + backId + ":" + detail, () =>
            {
                var b = new CreatureMeshBuilder();

                // Autorado no espaco do socket, sem offset lateral. Trait central e
                // centralizado pelo slot em CreatureAssembler.ReseatRigidParts, nao aqui:
                // o offset embutido tinha o sinal invertido e jogava a barbatana para
                // FORA do flanco em vez de para a linha do dorso.
                const float lateral = 0f;

                switch (backId)
                {
                    case "BACK_02_LOW_SPIKES":
                        for (var i = 0; i < 5; i++)
                        {
                            var (y, z) = Ridge(Mathf.Lerp(0.140f, -0.170f, i / 4f));
                            b.Spike(new Vector3(-lateral, y - 0.008f, z), new Vector3(0.22f, 0.86f, -0.46f),
                                0.052f, 0.016f, 5, 0.16f, Vector3.forward);
                        }

                        break;

                    case "BACK_03_FIN":
                        // Barbatana dorsal unica: placas altas no centro, baixando nas pontas.
                        for (var i = 0; i < 6; i++)
                        {
                            var t = i / 5f;
                            var (y, z) = Ridge(Mathf.Lerp(0.150f, -0.200f, t));
                            var h = Mathf.Sin((t * 0.82f + 0.14f) * Mathf.PI) * 0.115f;
                            b.Plate(new Vector3(-lateral, y + h * 0.44f - 0.006f, z), Vector3.up, Vector3.right,
                                h, 0.062f, 0.009f, 0.50f);
                        }

                        break;

                    case "BACK_04_CRYSTAL_SPINES":
                        for (var i = 0; i < 4; i++)
                        {
                            var (y, z) = Ridge(Mathf.Lerp(0.120f, -0.180f, i / 3f));
                            var scale = 1f - Mathf.Abs(i - 1.1f) * 0.15f;
                            b.Spike(new Vector3(-lateral, y - 0.010f, z), new Vector3(0.26f, 0.94f, -0.22f),
                                0.118f * scale, 0.021f, 5, 0.03f, Vector3.forward);
                        }

                        break;

                    case "BACK_05_ARMORED_SPINES":
                        for (var i = 0; i < 4; i++)
                        {
                            var (y, z) = Ridge(Mathf.Lerp(0.130f, -0.180f, i / 3f));

                            // Placa de base costurada ao dorso + espinho saindo dela.
                            b.Plate(new Vector3(-lateral, y - 0.012f, z), Vector3.up, Vector3.right,
                                0.030f, 0.082f, 0.016f, 0.80f);
                            b.Spike(new Vector3(-lateral, y + 0.006f, z), new Vector3(0.22f, 0.90f, -0.38f),
                                0.088f, 0.026f, 6, 0.18f, Vector3.forward);
                        }

                        break;

                    default:
                        for (var i = 0; i < 4; i++)
                        {
                            var (y, z) = Ridge(Mathf.Lerp(0.125f, -0.175f, i / 3f));
                            b.Plate(new Vector3(-lateral, y - 0.008f, z), Vector3.up, Vector3.right,
                                0.052f, 0.090f, 0.015f, 0.66f);
                        }

                        break;
                }

                return b.Build("GENORYX_BACK_" + backId, null);
            });
        }

        /// <summary>
        /// Quanto o dorso desce em relacao ao BackSocket num offset Z local.
        /// Sem isto uma fileira reta de espinhos flutuaria na frente e afundaria atras,
        /// porque o socket e um ponto unico e o dorso e curvo.
        /// </summary>
        static (float y, float z) Ridge(float localZ)
        {
            var worldZ = CreatureChassisSpec.BackZ + localZ;
            var here = Sample(Silhouette, worldZ).topY;
            var anchor = Sample(Silhouette, CreatureChassisSpec.BackZ).topY;
            return (here - anchor, localZ);
        }

        public static bool BackIsCentered(string backId)
        {
            return backId == "BACK_03_FIN";
        }

        public static Mesh Core(string coreId, float detail = 1f)
        {
            return Cached("core:" + coreId + ":" + detail, () =>
            {
                var b = new CreatureMeshBuilder();
                var facets = coreId switch
                {
                    "CORE_02_FROST" => 6,
                    "CORE_03_NATURE" => 5,
                    "CORE_04_ARCANE" => 8,
                    "CORE_05_VOID" => 7,
                    _ => 6
                };

                var height = coreId switch
                {
                    "CORE_02_FROST" => 0.098f,
                    "CORE_03_NATURE" => 0.078f,
                    "CORE_04_ARCANE" => 0.090f,
                    "CORE_05_VOID" => 0.104f,
                    _ => 0.086f
                };

                // Gema facetada crescendo para fora (+X local) a partir de dentro do corpo.
                // A base recua proporcionalmente a altura: assim o centro de massa fica
                // sempre DENTRO da carne (gema cravada) e so a ponta emerge, qualquer que
                // seja o Core. Com recuo fixo, o Core mais alto (VOID) sobrava para fora.
                var baseCenter = new Vector3(-height * 0.42f, 0f, 0f);

                // Secao ELIPTICA, mais alta que larga. Com secao circular a gema virava um
                // hexagono chapado visto de perfil, que e exatamente o angulo em que ela
                // aparece: parecia adesivo, nao cristal cravado. A lasca vertical le como
                // mineral em qualquer angulo.
                var rimY = 0.050f;
                var rimZ = 0.032f;

                // Tres aneis (base, ombro, cintura) + ponta: o ombro cria a quebra de
                // silhueta que faz o olho ler cristal, coisa que uma bipiramide simples
                // com um anel unico nao entrega.
                var profile = new[]
                {
                    (x: 0.00f, r: 0.62f),
                    (x: 0.26f, r: 1.00f),
                    (x: 0.60f, r: 0.66f)
                };

                var rings = new Vector3[profile.Length][];
                for (var s = 0; s < profile.Length; s++)
                {
                    rings[s] = new Vector3[facets];
                    for (var i = 0; i < facets; i++)
                    {
                        var a = Mathf.PI * 2f * i / facets;
                        rings[s][i] = baseCenter + new Vector3(
                            height * profile[s].x,
                            Mathf.Sin(a) * rimY * profile[s].r,
                            Mathf.Cos(a) * rimZ * profile[s].r);
                    }
                }

                var tip = baseCenter + new Vector3(height, 0f, 0f);

                // O anel percorre +Z -> +Y, entao a ordem (next, i, adiante) e a que fecha
                // com a normal para FORA. Invertida, a gema inteira caia no backface
                // culling e o Core simplesmente nao existia na tela, mesmo com renderer
                // ligado, mesh valido e 3 cm de protrusao medida.
                for (var i = 0; i < facets; i++)
                {
                    var next = (i + 1) % facets;

                    for (var s = 0; s < profile.Length - 1; s++)
                    {
                        b.FlatQuad(rings[s][next], rings[s][i], rings[s + 1][i], rings[s + 1][next],
                            (float)s / profile.Length, (s + 1f) / profile.Length);
                    }

                    var last = profile.Length - 1;
                    b.FlatTri(rings[last][next], rings[last][i], tip,
                        new Vector2(1f, 0.7f), new Vector2(0f, 0.7f), new Vector2(0.5f, 1f));
                    b.FlatTri(rings[0][i], rings[0][next], baseCenter,
                        new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(0.5f, -0.4f));
                }

                return b.Build("GENORYX_CORE_" + coreId, null);
            });
        }

        /// <summary>Anel escuro que ancora o Core na carne, para nao parecer icone flutuando.</summary>
        public static Mesh CoreSocketRim(float detail = 1f)
        {
            return Cached("corerim:" + detail, () =>
            {
                var b = new CreatureMeshBuilder();
                var seg = Seg(16, detail);
                var inner = 0.046f;
                var outer = 0.062f;
                var innerRing = b.RingOriented(new Vector3(-0.008f, 0f, 0f), Vector3.forward, Vector3.up, inner, inner, seg, 2f, 0f);
                var outerRing = b.RingOriented(new Vector3(-0.026f, 0f, 0f), Vector3.forward, Vector3.up, outer, outer, seg, 2f, 1f);
                b.Bridge(innerRing, outerRing, seg);
                return b.Build("GENORYX_CORE_RIM", null);
            });
        }
    }
}
