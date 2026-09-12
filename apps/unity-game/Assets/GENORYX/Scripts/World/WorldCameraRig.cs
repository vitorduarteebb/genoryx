using UnityEngine;

namespace Genoryx
{
    /// <summary>3/4 a 35–45°. Vê frente, lateral, telhado e chão. Não é top-down.</summary>
    public class WorldCameraRig : MonoBehaviour
    {
        public Transform target;
        public float pitch = 48f;
        public float yaw = 40f;
        public float distance = 20f;
        public float minDistance = 16f;
        public float maxDistance = 26f;
        public float follow = 5.2f;
        public float lookHeight = 1.5f;

        void LateUpdate()
        {
            if (target == null)
            {
                return;
            }

            var scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.001f)
            {
                distance = Mathf.Clamp(distance - scroll * 4f, minDistance, maxDistance);
            }

            if (Input.GetMouseButton(1))
            {
                yaw += Input.GetAxis("Mouse X") * 80f * Time.deltaTime;
            }

            var rot = Quaternion.Euler(pitch, yaw, 0f);
            var origin = target.position + Vector3.up * 1.6f;
            var desired = target.position + rot * (Vector3.back * distance);
            var dir = desired - origin;
            if (dir.sqrMagnitude > 0.01f && Physics.SphereCast(origin, 0.2f, dir.normalized, out var hit, dir.magnitude) && !hit.transform.IsChildOf(target))
            {
                desired = hit.point + hit.normal * 0.35f;
            }

            transform.position = Vector3.Lerp(transform.position, desired, Time.deltaTime * follow);
            transform.LookAt(target.position + Vector3.up * lookHeight);
            var cam = GetComponent<Camera>();
            if (cam != null)
            {
                cam.fieldOfView = HavenSliceBuilder.CameraFov;
            }
        }
    }
}
