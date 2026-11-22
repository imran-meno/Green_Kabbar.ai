function SceneBackdrop() {
  return (
    <>
      <circle cx="337" cy="48" r="25" fill="var(--action)">
        <animate attributeName="r" values="24;28;24" dur="3s" repeatCount="indefinite" />
      </circle>
      <path d="M0 236H400" stroke="var(--cream)" strokeOpacity=".35" strokeWidth="2" />
      <path d="M0 253H400" stroke="var(--cream)" strokeOpacity=".65" strokeDasharray="18 15" strokeWidth="2">
        <animate attributeName="stroke-dashoffset" from="0" to="-33" dur="1.2s" repeatCount="indefinite" />
      </path>
      <path d="M38 71h65M212 99h48" stroke="var(--cream)" strokeDasharray="14 12" strokeOpacity=".28" strokeWidth="12" strokeLinecap="round">
        <animate attributeName="stroke-dashoffset" from="0" to="90" dur="8s" repeatCount="indefinite" />
      </path>
    </>
  );
}

function PickupTruck() {
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" values="-150 0;430 0" dur="9s" repeatCount="indefinite" />
      <rect x="0" y="185" width="82" height="48" rx="6" fill="var(--action)" stroke="var(--cream)" strokeWidth="2" />
      <text x="41" y="204" fill="var(--forest)" textAnchor="middle" fontSize="10" fontWeight="800">GREEN</text>
      <text x="41" y="219" fill="var(--forest)" textAnchor="middle" fontSize="10" fontWeight="800">KABBAR</text>
      <path d="M83 202h25l18 19v12H83z" fill="var(--cream)" stroke="var(--forest)" strokeWidth="2" />
      <path d="M105 205h8l10 12h-18z" fill="var(--action)" />
      <circle cx="25" cy="237" r="10" fill="var(--forest)" stroke="var(--cream)" strokeWidth="3" />
      <circle cx="108" cy="237" r="10" fill="var(--forest)" stroke="var(--cream)" strokeWidth="3" />
      <path d="M20 237h10m73 0h10" stroke="var(--cream)" strokeWidth="2" />
    </g>
  );
}

function Coin({ x, y, delay = 0, children = 'Rs' }) {
  return (
    <g>
      <circle cx={x} cy={y} r="12" fill="var(--gold)" />
      <text x={x} y={y + 3} fill="var(--forest)" fontSize="7" fontWeight="800" textAnchor="middle">{children}</text>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -63;0 -63;0 0" keyTimes="0;.45;.75;1" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.75;1" dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" />
    </g>
  );
}

function LoginScene() {
  return (
    <>
      <SceneBackdrop />
      <path d="M245 154v-28l38-30 38 30v28z" fill="var(--cream)" />
      <path d="M237 128l46-37 46 37" fill="none" stroke="var(--action)" strokeWidth="9" strokeLinejoin="round" />
      <rect x="273" y="132" width="18" height="22" fill="var(--forest)" />
      <g fill="var(--action)" opacity=".8">
        <rect x="178" y="211" width="16" height="22" rx="3" />
        <rect x="197" y="216" width="22" height="17" rx="2" />
        <path d="M221 224l16-18 17 18v9h-33z" />
      </g>
      <PickupTruck />
      <Coin x={198} y={190} delay={0.4} />
      <Coin x={229} y={202} delay={1.2} />
      <Coin x={258} y={190} delay={2} />
    </>
  );
}

function RegisterScene() {
  return (
    <>
      <SceneBackdrop />
      <path d="M147 166h106l-9 78q-3 22-25 22h-38q-22 0-25-22z" fill="var(--action)" stroke="var(--cream)" strokeWidth="3" />
      <path d="M143 165q57-23 114 0" fill="none" stroke="var(--cream)" strokeWidth="7" strokeLinecap="round" />
      <text x="200" y="218" fill="var(--forest)" textAnchor="middle" fontSize="24" fontWeight="800">GK</text>
      <g>
        <rect x="64" y="61" width="17" height="32" rx="4" fill="var(--cream)" />
        <animateMotion path="M0 0 Q75 28 120 124" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.72;.83;1" dur="2.8s" repeatCount="indefinite" />
      </g>
      <g>
        <rect x="321" y="52" width="24" height="22" rx="3" fill="var(--cream)" />
        <path d="M321 60h24m-24 7h24" stroke="var(--forest)" strokeWidth="3" />
        <animateMotion path="M0 0 Q-75 38 -145 140" dur="2.8s" begin=".6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.72;.83;1" dur="2.8s" begin=".6s" repeatCount="indefinite" />
      </g>
      <g>
        <path d="M45 155h27v18H45z" fill="var(--cream)" />
        <animateMotion path="M0 0 Q60 -18 145 14" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.72;.83;1" dur="2.8s" begin="1.2s" repeatCount="indefinite" />
      </g>
      <Coin x={185} y={157} delay={0.9} />
      <Coin x={216} y={157} delay={1.5} />
      <Coin x={200} y={150} delay={2.1} />
    </>
  );
}

function HomeScene() {
  return (
    <>
      <SceneBackdrop />
      <path d="M300 156v-33l38-29 38 29v33z" fill="var(--cream)" />
      <path d="M292 124l46-36 46 36" fill="none" stroke="var(--action)" strokeWidth="9" strokeLinejoin="round" />
      <rect x="330" y="133" width="17" height="23" fill="var(--forest)" />
      <rect x="36" y="57" width="79" height="145" rx="13" fill="var(--forest)" stroke="var(--cream)" strokeWidth="3" />
      <rect x="44" y="68" width="63" height="122" rx="7" fill="var(--cream)" />
      <rect x="64" y="103" width="25" height="47" rx="6" fill="var(--action)" />
      <path d="M69 114l7 7 11-13" fill="none" stroke="var(--cream)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="44" y="68" width="63" height="4" fill="var(--action)">
        <animate attributeName="y" values="68;186;68" dur="2.4s" repeatCount="indefinite" />
      </rect>
      <g className="scene-price-tag">
        <path d="M145 83h96q15 0 15 15v20q0 15-15 15h-96l-17-25z" fill="var(--gold)" />
        <text x="194" y="114" fill="var(--forest)" textAnchor="middle" fontSize="18" fontWeight="800">Rs 1,250</text>
      </g>
      <Coin x={270} y={172} delay={0.7} />
      <PickupTruck />
    </>
  );
}

const scenes = {
  login: { label: 'Login: a Green Kabbar pickup truck collects scrap and returns value', content: <LoginScene /> },
  register: { label: 'Register: recyclable materials drop into a Green Kabbar sack as coins appear', content: <RegisterScene /> },
  home: { label: 'Home: scrap is scanned, priced, and collected by a Green Kabbar truck', content: <HomeScene /> },
};

export default function AnimatedScene({ scene, className = '' }) {
  const selectedScene = scenes[scene] || scenes.home;
  return (
    <svg className={`animated-scene ${className}`} viewBox="0 0 400 280" role="img" aria-label={selectedScene.label}>
      <title>{selectedScene.label}</title>
      {selectedScene.content}
    </svg>
  );
}
