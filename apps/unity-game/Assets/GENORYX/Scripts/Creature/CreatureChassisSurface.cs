using UnityEngine;

namespace Genoryx.Creatures
{
    /// <summary>
    /// Superficie analitica do GENORYX_CORE_CHASSIS_V1, usada para responder uma pergunta:
    /// esta peca rigida esta saliente ou afundada na carne?
    ///
    /// Por que analitica e nao amostrada da malha:
    ///   - AABB e inutil: a caixa do corpo engole a cabeca inteira, entao um chifre
    ///     perfeitamente saliente aparecia como "dentro do corpo".
    ///   - mapa radial esferico erra em corpo alongado: o setor que aponta para cima
    ///     herda o raio grande do focinho.
    ///   - mapa cilindrico binado erra em secao achatada: o maximo do setor vem do raio
    ///     mais raso, superestimando a superficie ao longo de raios inclinados.
    ///
    /// CreatureMeshLab gera os aneis a partir de um perfil de superellipse, entao avaliar
    /// esse mesmo perfil da a superficie EXATA, sem discretizacao e sem alocacao.
    ///
    /// Espaco de trabalho: o espaco AUTORADO do CreatureRoot, que e onde as malhas skinadas
    /// vivem. <see cref="ToAuthored"/> traz uma peca rigida para ca passando pelo bone de
    /// referencia, o que torna a medida imune a animacao e a growth stage.
    /// </summary>
    public static class CreatureChassisSurface
    {
        /// <summary>
        /// Distancia assinada de um ponto a superficie do corpo. Positivo = fora da carne.
        /// </summary>
        public static float BodyClearance(Vector3 authored)
        {
            var rear = CreatureChassisSpec.BodyRearZ;
            var front = CreatureChassisSpec.BodyFrontZ;
            if (authored.z < rear)
            {
                return rear - authored.z;
            }

            if (authored.z > front)
            {
                return authored.z - front;
            }

            CreatureMeshLab.BodySection(authored.z, out var center, out var halfWidth,
                out var halfHeight, out var squareness);
            return Clearance(authored, center, halfWidth, halfHeight, squareness);
        }

        /// <summary>
        /// Distancia assinada de um ponto a superficie da cabeca de um estilo.
        /// Positivo = fora da carne.
        /// </summary>
        public static float HeadClearance(string headId, Vector3 authored)
        {
            CreatureMeshLab.HeadRange(headId, out var minZ, out var maxZ);
            if (authored.z < minZ)
            {
                return minZ - authored.z;
            }

            if (authored.z > maxZ)
            {
                return authored.z - maxZ;
            }

            CreatureMeshLab.HeadSection(headId, authored.z, out var center, out var halfWidth,
                out var halfHeight, out var squareness);
            return Clearance(authored, center, halfWidth, halfHeight, squareness);
        }

        /// <summary>
        /// Distancia assinada a superellipse |x/a|^n + |y/b|^n = 1.
        ///
        /// s = (u^n + v^n)^(1/n) vale 1 exatamente na superficie, entao o raio da superficie
        /// ao longo do mesmo raio e r/s e a folga e r - r/s.
        /// </summary>
        static float Clearance(Vector3 point, Vector3 center, float halfWidth, float halfHeight, float squareness)
        {
            var x = Mathf.Abs(point.x - center.x);
            var y = Mathf.Abs(point.y - center.y);
            var radial = Mathf.Sqrt(x * x + y * y);

            if (radial < 1e-6f)
            {
                return -Mathf.Min(halfWidth, halfHeight);
            }

            var u = x / Mathf.Max(halfWidth, 1e-5f);
            var v = y / Mathf.Max(halfHeight, 1e-5f);
            var n = Mathf.Max(squareness, 1.05f);
            var s = Mathf.Pow(Mathf.Pow(u, n) + Mathf.Pow(v, n), 1f / n);

            if (s < 1e-5f)
            {
                return -radial;
            }

            return radial - radial / s;
        }

        /// <summary>
        /// Matriz que leva uma peca rigida para o espaco autorado do CreatureRoot,
        /// passando pelo bone de referencia.
        ///
        /// Ir por restWorld(bone) * bone.worldToLocal cancela qualquer escala aplicada
        /// pelo growth e qualquer pose da animacao: o resultado e sempre a geometria
        /// autorada, que e a mesma coisa que o perfil analitico descreve.
        /// </summary>
        public static Matrix4x4 ToAuthored(Transform referenceBone, Transform part, string referenceBoneName)
        {
            var restWorld = Matrix4x4.TRS(
                CreatureRig.RestWorld(referenceBoneName),
                CreatureRig.RestWorldRotation(referenceBoneName),
                Vector3.one);

            return restWorld * referenceBone.worldToLocalMatrix * part.localToWorldMatrix;
        }

        /// <summary>
        /// Deslocamento ao longo de <paramref name="direction"/> que leva <paramref name="origin"/>
        /// exatamente a superficie.
        ///
        /// Existe porque os sockets sao contrato e ficam na pele do chassi NEUTRO. Uma cabeca
        /// de cranio alto levanta a pele acima do socket, e o chifre nasceria dentro da carne.
        /// Em vez de mover o socket (proibido) ou alongar a peca (deforma o design), a peca
        /// desliza ao longo do proprio eixo ate pousar na pele da cabeca escolhida.
        ///
        /// Retorna negativo quando a pele esta abaixo do socket, o que reassenta a peca
        /// para baixo em vez de deixa-la flutuando.
        /// </summary>
        public static float SurfaceLift(Vector3 origin, Vector3 direction, System.Func<Vector3, float> clearance,
            float searchRange = 0.25f)
        {
            direction = direction.normalized;
            if (direction.sqrMagnitude < 0.5f)
            {
                return 0f;
            }

            // Varre de FORA para dentro e para no primeiro ponto submerso. Testar so as duas
            // pontas do intervalo nao serve: em socket que ja esta fora da carne, o ponto
            // interno do intervalo pode atravessar o corpo e sair do outro lado, o que faria
            // o bracket concluir "superficie aqui" e enterrar a peca.
            const int steps = 48;
            var stride = searchRange * 2f / steps;
            var lo = float.NaN;
            for (var i = steps; i >= 0; i--)
            {
                var t = -searchRange + stride * i;
                if (clearance(origin + direction * t) < 0f)
                {
                    lo = t;
                    break;
                }
            }

            if (float.IsNaN(lo))
            {
                // Nenhum ponto do intervalo esta na carne: o eixo passa raspando.
                return -searchRange;
            }

            var hi = lo + stride;
            for (var i = 0; i < 24; i++)
            {
                var mid = (lo + hi) * 0.5f;
                if (clearance(origin + direction * mid) < 0f)
                {
                    lo = mid;
                }
                else
                {
                    hi = mid;
                }
            }

            return (lo + hi) * 0.5f;
        }

        /// <summary>
        /// Quanto a peca sai da superficie, medido no vertice que mais protubera.
        /// Negativo significa peca inteiramente submersa.
        /// </summary>
        public static float MaxProtrusion(Mesh part, Matrix4x4 toAuthored, System.Func<Vector3, float> clearance)
        {
            if (part == null)
            {
                return 0f;
            }

            var vertices = part.vertices;
            if (vertices.Length == 0)
            {
                return 0f;
            }

            var best = float.NegativeInfinity;
            for (var i = 0; i < vertices.Length; i++)
            {
                best = Mathf.Max(best, clearance(toAuthored.MultiplyPoint3x4(vertices[i])));
            }

            return best;
        }
    }
}
