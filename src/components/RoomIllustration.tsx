export default function RoomIllustration({ label }: { label: string }) {
  return (
    <svg
      className="room-art"
      viewBox="0 0 660 620"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="wall" x2="1" y2="1">
          <stop stopColor="#f7f4ec" />
          <stop offset="1" stopColor="#e8e5dc" />
        </linearGradient>
        <linearGradient id="floor" x2="0" y2="1">
          <stop stopColor="#d9c6ac" />
          <stop offset="1" stopColor="#eddcca" />
        </linearGradient>
        <linearGradient id="sofa" x2="0" y2="1">
          <stop stopColor="#fffdf8" />
          <stop offset="1" stopColor="#d8d3c7" />
        </linearGradient>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#bdcedc" />
          <stop offset="1" stopColor="#edf1ee" />
        </linearGradient>
        <filter id="shadow">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect width="660" height="620" fill="url(#wall)" />
      <path d="M0 448H660V620H0Z" fill="url(#floor)" />
      <path
        d="M0 452H660M0 504H660M0 562H660M140 452L80 620M310 452L290 620M470 452L500 620M610 452L660 620"
        stroke="#b9a388"
        opacity=".25"
      />
      <rect x="345" y="55" width="245" height="345" rx="120" fill="#d5d0c2" />
      <path d="M358 389V177a109 109 0 0 1 218 0v212Z" fill="url(#sky)" />
      <g fill="#a7b3b7" opacity=".55">
        <path d="M362 334h25v-25h18v25h25v-14h40v23h18v-33h19v-20h8v20h17v26h35v53H362Z" />
        <path d="M409 316v-26h3v-9h3v9h3v26M536 321v-48h3v-15h3v15h3v48" />
      </g>
      <path d="M467 67V390M357 225H577" stroke="#fbfaf7" strokeWidth="9" />
      <path
        d="M336 50h24v375h-37ZM578 50h30l18 375h-47Z"
        fill="#fefdf9"
        opacity=".82"
      />
      <path d="M357 283L552 454L337 491L88 448Z" fill="#fff6d1" opacity=".36" />
      <rect x="80" y="116" width="147" height="183" fill="#b29774" />
      <rect x="88" y="124" width="131" height="167" fill="#fffdf7" />
      <path d="M111 265v-69a41 41 0 0 1 82 0v69Z" fill="#d9bc8f" />
      <circle cx="150" cy="171" r="20" fill="#f3e3be" />
      <path d="M111 250l44-39 38 27v27h-82Z" fill="#09244b" />
      <ellipse
        cx="300"
        cy="512"
        rx="240"
        ry="41"
        fill="#947f68"
        opacity=".16"
        filter="url(#shadow)"
      />
      <ellipse cx="300" cy="529" rx="250" ry="58" fill="#f5f1e7" />
      <g stroke="#ded9ce" strokeWidth="1">
        <ellipse cx="300" cy="529" rx="228" ry="47" fill="none" />
        <ellipse cx="300" cy="529" rx="214" ry="39" fill="none" />
      </g>
      <path d="M109 461v36M421 461v36" stroke="#9a7857" strokeWidth="12" />
      <rect x="94" y="335" width="345" height="122" rx="28" fill="url(#sofa)" />
      <rect x="103" y="333" width="165" height="101" rx="25" fill="#f4f0e7" />
      <rect x="271" y="333" width="165" height="101" rx="25" fill="#eeeade" />
      <rect x="97" y="421" width="339" height="59" rx="17" fill="url(#sofa)" />
      <rect x="78" y="396" width="49" height="84" rx="17" fill="#e4dfd2" />
      <rect x="410" y="396" width="47" height="84" rx="17" fill="#e4dfd2" />
      <path d="M143 366q-7-12 9-15l60-4q11 0 14 11l8 53-84 4Z" fill="#dfb742" />
      <path d="M327 360q4-10 14-7l46 9q12 3 10 14l-8 42-74-4Z" fill="#173553" />
      <path d="M128 434H411" stroke="#c8c1b2" />
      <path d="M312 519l-8 55M433 518l14 51" stroke="#8e6944" strokeWidth="8" />
      <ellipse cx="371" cy="511" rx="91" ry="23" fill="#b59770" />
      <ellipse cx="371" cy="506" rx="91" ry="23" fill="#d0b48e" />
      <rect x="352" y="494" width="38" height="7" rx="2" fill="#102d50" />
      <rect x="358" y="488" width="38" height="6" rx="2" fill="#ece7db" />
      <path d="M402 461h19l-3 31h-13Z" fill="#f9f7ef" />
      <path
        d="M411 465v-30m0 9q-20-16-19-26q25 3 19 26m0-8q4-20 18-22q1 18-18 22"
        stroke="#667456"
        fill="#778565"
        strokeWidth="2"
      />
      <path
        d="M551 351v98m0-61q-52-36-43-72q46 11 43 72m0-24q4-55 43-66q3 43-43 66m0-12q-32-50-13-76q30 25 13 76m0 57q16-37 41-37q2 31-41 37"
        stroke="#65735a"
        strokeWidth="4"
        fill="#7c896a"
      />
      <path d="M518 431h68l-10 69h-48Z" fill="#a58a6a" />
      <ellipse cx="552" cy="431" rx="34" ry="7" fill="#bea587" />
      <g fill="#ffcb18">
        <path d="M280 94q0 18-18 18q18 0 18 18q0-18 18-18q-18 0-18-18Z" />
        <path d="M481 285q0 12-12 12q12 0 12 12q0-12 12-12q-12 0-12-12Z" />
      </g>
    </svg>
  );
}
