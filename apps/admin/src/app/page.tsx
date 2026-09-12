const capabilities = [
  "Jogadores, ban e silêncio",
  "Economia e mercado",
  "Logs de batalha e criaturas",
  "Eventos e world boss",
  "Drops e spawn",
];

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.4em] text-crystal">Administração</p>
      <h1 className="mt-3 font-display text-4xl text-gold">GENORYX Control Center</h1>
      <p className="mt-4 max-w-xl text-[#9a90a8]">
        Placeholder da Milestone 0. Operações reais entram no item 29 da ordem absoluta, sempre
        com `admin_action_logs` e motivo obrigatório.
      </p>
      <a href="/economy" className="mt-6 inline-block text-sm text-crystal">
        Economy Dashboard (interno)
      </a>
      <ul className="mt-8 space-y-2 text-sm text-[#f4efe4]">
        {capabilities.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-[#2a2438] bg-panel px-4 py-3 text-[#9a90a8]"
          >
            {item} — bloqueado até M29
          </li>
        ))}
      </ul>
    </main>
  );
}
