type Disposable = { dispose?: () => void };

type MeshLike = {
  geometry?: Disposable;
  material?: Disposable | Disposable[];
};

export function disposeMaterial(material: Disposable | Disposable[]) {
  const list = Array.isArray(material) ? material : [material];
  for (const item of list) {
    if (!item) continue;
    for (const value of Object.values(item)) {
      const texture = value as { isTexture?: boolean; dispose?: () => void };
      if (texture?.isTexture && texture.dispose) {
        texture.dispose();
      }
    }
    item.dispose?.();
  }
}

export function disposeObject3D(root: { traverse: (fn: (child: unknown) => void) => void }) {
  root.traverse((node) => {
    const child = node as MeshLike;
    child.geometry?.dispose?.();
    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}
