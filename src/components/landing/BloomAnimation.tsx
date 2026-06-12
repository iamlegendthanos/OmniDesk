import { useEffect, useRef } from "react";

export default function BloomAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const lines = svgRef.current?.querySelectorAll(".svg-draw");
    lines?.forEach((line, i) => {
      (line as SVGElement).style.animationDelay = `${0.1 + i * 0.15}s`;
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 320 280"
      className="w-full max-w-xs"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Core */}
      <circle cx="160" cy="150" r="20" stroke="currentColor" strokeWidth="1" fill="none" />
      <circle cx="160" cy="150" r="9" fill="currentColor" opacity="0.1" />
      <text x="160" y="154" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="DM Sans" fontWeight="500" opacity="0.6">OMNI</text>

      {/* Lines */}
      <line className="svg-draw" x1="160" y1="130" x2="160" y2="62" stroke="currentColor" strokeWidth="1" />
      <line className="svg-draw" x1="174" y1="141" x2="235" y2="88" stroke="currentColor" strokeWidth="1" />
      <line className="svg-draw" x1="180" y1="150" x2="256" y2="150" stroke="currentColor" strokeWidth="1" />
      <line className="svg-draw" x1="174" y1="159" x2="235" y2="214" stroke="currentColor" strokeWidth="1" />
      <line className="svg-draw" x1="146" y1="141" x2="85" y2="88" stroke="currentColor" strokeWidth="1" />
      <line className="svg-draw" x1="140" y1="150" x2="64" y2="150" stroke="currentColor" strokeWidth="1" />

      {/* Stripe */}
      <g className="float-anim" style={{ animationDelay: "0s" }}>
        <circle cx="160" cy="46" r="17" stroke="currentColor" strokeWidth="1" fill="hsl(var(--card))" />
        {[0,60,120,180,240,300].map((d,i) => (
          <ellipse key={i} cx={160+Math.cos(d*Math.PI/180)*12} cy={46+Math.sin(d*Math.PI/180)*12}
            rx="5" ry="2.5" fill="#635BFF" opacity="0.18"
            transform={`rotate(${d},${160+Math.cos(d*Math.PI/180)*12},${46+Math.sin(d*Math.PI/180)*12})`} />
        ))}
        <text x="160" y="51" textAnchor="middle" fontSize="12" fill="#635BFF" fontFamily="DM Sans" fontWeight="700">S</text>
        <text x="160" y="73" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5" fontFamily="DM Sans">Stripe</text>
      </g>

      {/* Shopify */}
      <g className="float-anim" style={{ animationDelay: "0.8s" }}>
        <circle cx="248" cy="76" r="17" stroke="currentColor" strokeWidth="1" fill="hsl(var(--card))" />
        {[0,60,120,180,240,300].map((d,i) => (
          <ellipse key={i} cx={248+Math.cos(d*Math.PI/180)*12} cy={76+Math.sin(d*Math.PI/180)*12}
            rx="5" ry="2.5" fill="#96BF48" opacity="0.18"
            transform={`rotate(${d},${248+Math.cos(d*Math.PI/180)*12},${76+Math.sin(d*Math.PI/180)*12})`} />
        ))}
        <text x="248" y="81" textAnchor="middle" fontSize="10" fill="#96BF48" fontFamily="DM Sans">🛍</text>
        <text x="248" y="103" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5" fontFamily="DM Sans">Shopify</text>
      </g>

      {/* Make */}
      <g className="float-anim" style={{ animationDelay: "1.4s" }}>
        <circle cx="270" cy="150" r="17" stroke="currentColor" strokeWidth="1" fill="hsl(var(--card))" />
        {[0,60,120,180,240,300].map((d,i) => (
          <ellipse key={i} cx={270+Math.cos(d*Math.PI/180)*12} cy={150+Math.sin(d*Math.PI/180)*12}
            rx="5" ry="2.5" fill="#6D00CC" opacity="0.18"
            transform={`rotate(${d},${270+Math.cos(d*Math.PI/180)*12},${150+Math.sin(d*Math.PI/180)*12})`} />
        ))}
        <text x="270" y="155" textAnchor="middle" fontSize="12" fill="#6D00CC" fontFamily="DM Sans" fontWeight="700">M</text>
        <text x="270" y="177" textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.5" fontFamily="DM Sans">Make</text>
      </g>

      {/* QB */}
      <g className="float-anim" style={{ animationDelay: "0.4s" }}>
        <circle cx="72" cy="76" r="14" stroke="currentColor" strokeWidth="1" fill="hsl(var(--card))" />
        <text x="72" y="80" textAnchor="middle" fontSize="8" fill="#2CA01C" fontFamily="DM Sans" fontWeight="700">QB</text>
      </g>

      {/* Mailchimp */}
      <g className="float-anim" style={{ animationDelay: "1.1s" }}>
        <circle cx="50" cy="150" r="14" stroke="currentColor" strokeWidth="1" fill="hsl(var(--card))" />
        <text x="50" y="154" textAnchor="middle" fontSize="10" fill="#FFE01B" fontFamily="DM Sans">✉</text>
      </g>

      {/* Data particles */}
      <circle r="2" fill="#635BFF" opacity="0.5">
        <animateMotion dur="2.5s" repeatCount="indefinite" path="M160,130 L160,62" />
      </circle>
      <circle r="2" fill="#96BF48" opacity="0.5">
        <animateMotion dur="3s" repeatCount="indefinite" begin="0.6s" path="M174,141 L235,88" />
      </circle>
      <circle r="2" fill="#6D00CC" opacity="0.5">
        <animateMotion dur="2.8s" repeatCount="indefinite" begin="1.2s" path="M180,150 L256,150" />
      </circle>
    </svg>
  );
}
