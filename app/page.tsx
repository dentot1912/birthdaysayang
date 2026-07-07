"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: "heart" | "circle" | "square";
}

// Lace-bordered photo frame used in The tab
function LacePhotoFrame({ src, w, h, delay }: { src: string; w: number; h: number; delay: string }) {
  const padding = 18; // lace border thickness
  const svgW = w + padding * 2;
  const svgH = h + padding * 2;

  // Lace dots along the rect perimeter
  const laceDots: { x: number; y: number; r: number }[] = [];
  const step = 9;
  // Top & Bottom
  for (let x = 0; x <= svgW; x += step) {
    laceDots.push({ x, y: 0, r: x % (step * 2) === 0 ? 3.5 : 2.4 });
    laceDots.push({ x, y: svgH, r: x % (step * 2) === 0 ? 3.5 : 2.4 });
  }
  // Left & Right
  for (let y = step; y < svgH; y += step) {
    laceDots.push({ x: 0, y, r: y % (step * 2) === 0 ? 3.5 : 2.4 });
    laceDots.push({ x: svgW, y, r: y % (step * 2) === 0 ? 3.5 : 2.4 });
  }

  return (
    <div
      className="group relative shrink-0 cursor-pointer"
      style={{
        width: svgW,
        height: svgH,
        animation: `slideUpFade 0.55s ease-out ${delay} both`,
        transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width={svgW}
        height={svgH}
        className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-300 drop-shadow-xl"
        style={{ transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1)" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Photo area background (shown while image loads or as placeholder) */}
        <rect x={padding} y={padding} width={w} height={h} fill="#5C4440" rx="2" />

        {/* Placeholder icon when no photo */}
        <text x={padding + w / 2} y={padding + h / 2 + 6} textAnchor="middle" fill="#EAD5C3" opacity="0.25" fontSize="22">📷</text>

        {/* Inner thin border */}
        <rect x={padding - 2} y={padding - 2} width={w + 4} height={h + 4} fill="none" stroke="#EAD5C3" strokeWidth="0.8" strokeOpacity="0.35" rx="3" />

        {/* Outer thin border */}
        <rect x={4} y={4} width={svgW - 8} height={svgH - 8} fill="none" stroke="#EAD5C3" strokeWidth="0.6" strokeOpacity="0.25" rx="4" />

        {/* Lace dot border */}
        {laceDots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#EAD5C3" opacity={i % 3 === 0 ? 0.5 : 0.3} />
        ))}

        {/* Corner decorative diamond clusters */}
        {[[padding, padding], [svgW - padding, padding], [padding, svgH - padding], [svgW - padding, svgH - padding]].map(([cx, cy], ci) => (
          <g key={ci}>
            <rect x={cx - 4} y={cy - 4} width={8} height={8} fill="#EAD5C3" opacity="0.3" transform={`rotate(45,${cx},${cy})`} />
            <rect x={cx - 2} y={cy - 2} width={4} height={4} fill="#EAD5C3" opacity="0.5" transform={`rotate(45,${cx},${cy})`} />
          </g>
        ))}
      </svg>

      {/* Actual photo — absolutely positioned over the placeholder */}
      <img
        src={src}
        alt="memory photo"
        className="absolute object-cover rounded-sm"
        style={{
          left: padding,
          top: padding,
          width: w,
          height: h,
        }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    </div>
  );
}

// Generates an SVG path for a postage stamp with scalloped edges
function getStampPath(width: number, height: number, r = 4, spacing = 12) {
  let d = `M ${r * 2} ${r}`;
  const cols = Math.floor((width - r * 4) / spacing);
  for (let i = 0; i <= cols; i++) {
    const x = r * 2 + i * spacing + spacing / 2;
    d += ` H ${x - r} A ${r} ${r} 0 0 0 ${x + r} ${r}`;
  }
  d += ` H ${width - r * 2} A ${r * 2} ${r * 2} 0 0 1 ${width} ${r * 2}`;
  
  const rows = Math.floor((height - r * 4) / spacing);
  for (let i = 0; i <= rows; i++) {
    const y = r * 2 + i * spacing + spacing / 2;
    d += ` V ${y - r} A ${r} ${r} 0 0 0 ${width} ${y + r}`;
  }
  d += ` V ${height - r * 2} A ${r * 2} ${r * 2} 0 0 1 ${width - r * 2} ${height}`;
  
  for (let i = cols; i >= 0; i--) {
    const x = r * 2 + i * spacing + spacing / 2;
    d += ` H ${x + r} A ${r} ${r} 0 0 0 ${x - r} ${height}`;
  }
  d += ` H ${r * 2} A ${r * 2} ${r * 2} 0 0 1 0 ${height - r * 2}`;
  
  for (let i = rows; i >= 0; i--) {
    const y = r * 2 + i * spacing + spacing / 2;
    d += ` V ${y + r} A ${r} ${r} 0 0 0 0 ${y - r}`;
  }
  d += ` Z`;
  return d;
}

// Photo filmstrip component used in the My Life tab
function PhotoStrip({ photos, bgStyle, rotateClass }: { photos: string[]; bgStyle: any; rotateClass?: string }) {
  return (
    <div
      className={`p-3 pt-4 pb-4 flex flex-col justify-between shadow-2xl rounded-sm ${rotateClass || ""} transition-all duration-300 hover:scale-105 hover:rotate-0 z-20 relative`}
      style={{
        ...bgStyle,
        width: "clamp(88px, 25vw, 115px)",
        height: "clamp(250px, 75vw, 330px)",
        border: "5px solid #FDFBF7",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.45), 0 8px 10px -6px rgba(0,0,0,0.45)",
      }}
    >
      {/* Film sprocket holes left */}
      <div className="absolute left-[3px] top-0 bottom-0 flex flex-col justify-between py-3 pointer-events-none z-30">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="w-1.5 h-2.5 bg-[#3E2E2B] rounded-[1px] opacity-90" />
        ))}
      </div>
      
      {/* Film sprocket holes right */}
      <div className="absolute right-[3px] top-0 bottom-0 flex flex-col justify-between py-3 pointer-events-none z-30">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="w-1.5 h-2.5 bg-[#3E2E2B] rounded-[1px] opacity-90" />
        ))}
      </div>

      {photos.map((src, i) => (
        <div key={i} className="relative w-full h-[85px] bg-[#5C4440] overflow-hidden rounded-[1px] border border-black/15 shadow-inner">
          <img
            src={src}
            alt="story photo"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
            <span className="text-xl text-[#EAD5C3] select-none">📷</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page-level tab-transition veil ───────────────────────────────────────────
function TabTransitionVeil({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[999] transition-opacity duration-300"
      style={{
        background: "radial-gradient(ellipse at center, #3A2320 0%, #1E100D 100%)",
        opacity: active ? 1 : 0,
      }}
    />
  );
}

const slides = [
  {
    id: 0,
    title: "Untuk Semestaku",
    decor: "✨",
    message: "Sejak ada kamu, duniaku jadi jauh lebih indah, hangat, dan penuh warna. Terima kasih telah hadir membawa bahagia di setiap hariku. Happy Birthday, sayang!",
    bgClass: "from-[#FDFBF7] to-[#F5ECE2] text-[#3E2E2B]",
    borderClass: "border-[#D3C1AD]",
    accentColor: "#8A7068"
  },
  {
    id: 1,
    title: "Hal Terfavorit",
    decor: "💖",
    message: "Terima kasih sudah menjadi bagian terpenting dalam hidupku. Senyum dan ketawamu selalu menjadi hal terfavorit yang paling ingin aku lihat setiap hari.",
    bgClass: "from-[#F5E5E9] to-[#E8D4D8] text-[#4E2E33]",
    borderClass: "border-[#C6B3B9]",
    accentColor: "#C08A93"
  },
  {
    id: 2,
    title: "Doa & Harapan",
    decor: "🌟",
    message: "Di hari spesialmu ini, aku berdoa semoga semua impian dan cita-citamu tercapai. Aku akan selalu ada di sampingmu untuk mendukungmu di setiap langkah.",
    bgClass: "from-[#F1F3F5] to-[#E2E6EA] text-[#2B3E50]",
    borderClass: "border-[#C1CAD2]",
    accentColor: "#7B92A6"
  },
  {
    id: 3,
    title: "Anugerah Terindah",
    decor: "🌹",
    message: "Terima kasih atas segala kesabaran, tawa hangat, dan kasih sayang tulus yang kamu berikan. Bersamamu adalah anugerah paling berharga dalam hidupku.",
    bgClass: "from-[#FAF0E6] to-[#EEDC9A]/20 text-[#3E2E2B]",
    borderClass: "border-[#E3C57B]",
    accentColor: "#B0954E"
  },
  {
    id: 4,
    title: "Selamanya Kita",
    decor: "💕",
    message: "Semoga hari ini penuh dengan kebahagiaan yang melimpah, persis seperti kebahagiaan yang selalu kamu bawa ke hidupku selama ini. I love you so much!",
    bgClass: "from-[#FDF2F8] to-[#FCE7F3] text-[#5C2140]",
    borderClass: "border-[#F9A8D4]",
    accentColor: "#DB2777"
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("happy-birthday");
  const [tabTransitioning, setTabTransitioning] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  
  const dragStartX = useRef<number | null>(null);
  const dragEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const totalSlides = 5;
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    dragEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!dragStartX.current || !dragEndX.current) return;
    const distance = dragStartX.current - dragEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    dragStartX.current = null;
    dragEndX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX.current !== null) {
      dragEndX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    if (!dragStartX.current || !dragEndX.current) return;
    const distance = dragStartX.current - dragEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
    dragStartX.current = null;
    dragEndX.current = null;
  };

  const handleMouseLeave = () => {
    dragStartX.current = null;
    dragEndX.current = null;
  };

  // Smooth tab-switch: flash veil in → swap tab → fade veil out
  const switchTab = (id: string) => {
    if (id === activeTab) return;
    setTabTransitioning(true);
    setTimeout(() => {
      setActiveTab(id);
      if (id === "the") {
        setCurrentSlide(0);
      }
      // Give the new tab a frame to mount before fading the veil out
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTabTransitioning(false);
        });
      });
    }, 250);
  };
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isGiftOpened, setIsGiftOpened] = useState<boolean>(false);
  const [claimedGift, setClaimedGift] = useState<boolean>(false);
  const [claimedTickets, setClaimedTickets] = useState<Record<number, boolean>>({});
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio Synth BGM
  const playBgm = () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      setIsPlayingAudio(true);
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const chords = [
        [130.81, 164.81, 196.0, 246.94], // Cmaj7 (C3, E3, G3, B3)
        [110.0, 146.83, 174.61, 220.0], // Fmaj7 (F2, D3, F3, A3)
        [146.83, 174.61, 220.0, 261.63], // Dm7 (D3, F3, A3, C4)
        [196.0, 246.94, 293.66, 349.23], // G7 (G3, B3, D4, F4)
      ];

      let chordIndex = 0;

      const playNote = (freq: number, time: number, duration: number) => {
        if (!audioCtxRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();
        const filter = audioCtxRef.current.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, time);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(700, time);

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.03, time + 0.4); // Very soft bell/chime sound
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);

        osc.start(time);
        osc.stop(time + duration);
      };

      const scheduler = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === "suspended") return;
        const noteTime = audioCtxRef.current.currentTime;
        const chord = chords[chordIndex];

        // Soft deep bass note
        playNote(chord[0] / 2, noteTime, 3.8);

        // Relaxing arpeggio chime sequence
        playNote(chord[0], noteTime, 2.5);
        playNote(chord[1], noteTime + 0.5, 2.5);
        playNote(chord[2], noteTime + 1.0, 2.5);
        playNote(chord[3], noteTime + 1.5, 2.5);
        playNote(chord[2], noteTime + 2.0, 2.5);
        playNote(chord[1], noteTime + 2.5, 2.5);

        chordIndex = (chordIndex + 1) % chords.length;
      };

      scheduler();
      audioIntervalRef.current = setInterval(scheduler, 3500);
      setIsPlayingAudio(true);
    } catch (e) {
      console.error("Audio Context failed to initialize", e);
    }
  };

  const stopBgm = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.suspend();
    }
    setIsPlayingAudio(false);
  };

  const toggleBgm = () => {
    if (isPlayingAudio) {
      stopBgm();
    } else {
      playBgm();
    }
  };

  // Clean up BGM on unmount
  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  // Confetti / Heart Canvas Particle Loop
  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const colors = ["#EAD5C3", "#F4E3D4", "#C6B3A2", "#FFB7B2", "#FFC6FF", "#BDB2FF"];

    const createParticle = (x: number, y: number, isInitial = false): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      return {
        x,
        y: isInitial ? Math.random() * -100 : y,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: isInitial ? (Math.random() - 0.5) * 2 : Math.cos(angle) * speed,
        speedY: isInitial ? Math.random() * 2 + 2 : Math.sin(angle) * speed - 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        opacity: 1,
        type: Math.random() > 0.4 ? "heart" : Math.random() > 0.5 ? "circle" : "square",
      };
    };

    // Populate initial shower
    for (let i = 0; i < 120; i++) {
      particles.push(createParticle(Math.random() * canvas.width, 0, true));
    }

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y + size / 4);
      ctx.quadraticCurveTo(x, y, x + size / 2, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
      ctx.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size / 2, y + size);
      ctx.quadraticCurveTo(x, y + (size * 2) / 3, x, y + size / 3);
      ctx.quadraticCurveTo(x, y, x + size / 2, y);
      ctx.closePath();
      ctx.fill();
    };

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.004;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        if (p.type === "heart") {
          drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
        } else if (p.type === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();

        if (p.opacity <= 0 || p.y > canvas.height) {
          if (particles.length < 120) {
            particles[i] = createParticle(Math.random() * canvas.width, -20, true);
          } else {
            particles.splice(i, 1);
            i--;
          }
        }
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        setShowConfetti(false);
      }
    };

    update();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [showConfetti]);

  // Click excitement handler
  const handleExcitedClick = () => {
    setShowConfetti(true);
    playBgm();
    // Smooth transition to next section
    setTimeout(() => {
      setActiveTab("of");
    }, 1500);
  };

  const navItems = [
    { id: "happy-birthday", label: "Happy birthday" },
    { id: "to", label: "To" },
    { id: "the", label: "The" },
    { id: "love", label: "Love" },
    { id: "of", label: "of" },
    { id: "my-life", label: "My life" },
  ];

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#3E2E2B] text-[#EAD5C3] px-4 py-4 sm:px-6 sm:py-6 md:px-16 md:py-10">
      {/* Tab transition veil */}
      <TabTransitionVeil active={tabTransitioning} />

      {/* Canvas for heart/confetti effects */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-50 w-full h-full"
        />
      )}

      {/* Top Header / Navigation */}
      <header className="w-full flex flex-col md:flex-row justify-end items-center gap-2 md:gap-4 z-40">

        {/* Elegant sentence-based navigation */}
        <nav className="flex flex-wrap justify-center gap-x-3 sm:gap-x-5 md:gap-x-6 gap-y-1.5 text-xs sm:text-sm md:text-base font-sans tracking-wide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className={`transition-all duration-300 hover:text-white relative pb-1 cursor-pointer ${activeTab === item.id
                  ? "font-bold text-[#EAD5C3]"
                  : "text-[#EAD5C3]/60 font-medium"
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Grid Content */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-16 items-center justify-items-center w-full max-w-6xl mx-auto my-4 sm:my-8 lg:my-12 z-30">
        {/* Left Side: Cake Visual (Sticky Anchor) */}
        <div className="relative flex justify-center items-center w-full max-w-[200px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-none">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[#EAD5C3]/5 rounded-full filter blur-3xl animate-pulse-slow"></div>

          <Image
            src="/assets/cake.png"
            alt="Beautiful Birthday Cake"
            width={480}
            height={480}
            priority
            className="object-contain animate-float drop-shadow-[0_20px_50px_rgba(234,213,195,0.15)] relative z-10"
          />
        </div>

        {/* Right Side: Dynamic Content Panel */}
        <div className="w-full flex flex-col justify-center text-center lg:text-left min-h-[350px] relative">
          {/* HOME TAB: "Happy birthday" */}
          {activeTab === "happy-birthday" && (
            <div className="flex flex-col items-center lg:items-start w-full">
              <div className="text-center flex flex-col items-center">
                <h1
                  className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-normal tracking-wider leading-none text-[#EAD5C3] ml-3 sm:ml-6 md:ml-16 z-50 animate-slide-up"
                  style={{ animationDelay: "100ms" }}
                >
                  HAPPY
                </h1>
                <h2
                  className="font-script text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-[#F4E3D4] -mt-2 sm:-mt-3 md:-mt-6 lg:-mt-8 ml-2 sm:ml-4 lg:ml-8 select-none animate-slide-up"
                  style={{ animationDelay: "180ms" }}
                >
                  Birthday
                </h2>
                <h3
                  className="font-serif italic text-lg sm:text-xl md:text-2xl tracking-[0.2em] tracking-wide text-[#C6B3A2] animate-slide-up"
                  style={{ animationDelay: "260ms" }}
                >
                  My Love
                </h3>
              </div>

              {/* Decorative flourish divider */}
              <div
                className="w-full max-w-xs md:max-w-md my-4 animate-fade-in"
                style={{ animationDelay: "340ms" }}
              >
                <svg
                  viewBox="0 0 300 24"
                  className="w-full h-8 text-[#EAD5C3] opacity-80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 20 12 C 20 6, 28 6, 28 12 C 28 18, 36 12, 50 12 L 135 12" />
                  <path d="M 135 12 C 142 12, 145 4, 150 4 C 155 4, 158 12, 165 12" />
                  <path d="M 135 12 C 142 12, 145 20, 150 20 C 155 20, 158 12, 165 12" />
                  <path d="M 165 12 L 250 12 C 264 12, 272 18, 272 12 C 272 6, 280 6, 280 12" />
                  <circle cx="150" cy="12" r="2.5" fill="currentColor" />
                  <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="285" cy="12" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>

              <p
                className="font-serif text-base sm:text-lg md:text-xl text-[#EAD5C3]/90 max-w-sm sm:max-w-md leading-relaxed mt-2 animate-slide-up"
                style={{ animationDelay: "420ms" }}
              >
                Are you excited to see what I've prepared for you?!
              </p>

              {/* Pill CTA Buttons */}
              <div
                className="flex gap-4 sm:gap-6 mt-8 w-full justify-center lg:justify-start animate-slide-up"
                style={{ animationDelay: "500ms" }}
              >
                <button
                  onClick={() => switchTab("to")}
                  className="px-8 py-3 rounded-full bg-[#574944] text-[#EAD5C3] font-serif text-sm tracking-widest uppercase underline underline-offset-4 decoration-1 hover:bg-[#685954] hover:text-white transition-all duration-300 shadow-lg border border-[#EAD5C3]/15 transform hover:-translate-y-1 cursor-pointer"
                >
                  YES!!!
                </button>
                <button
                  onClick={() => switchTab("to")}
                  className="px-8 py-3 rounded-full bg-[#574944] text-[#EAD5C3] font-serif text-sm tracking-widest uppercase underline underline-offset-4 decoration-1 hover:bg-[#685954] hover:text-white transition-all duration-300 shadow-lg border border-[#EAD5C3]/15 transform hover:-translate-y-1 cursor-pointer"
                >
                  DUHH!!!
                </button>
              </div>
            </div>
          )}

          {/* TO TAB: Full-screen overlay with lace hearts */}
          {activeTab === "to" && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#3E2E2B] overflow-hidden">

              {/* Bow/Ribbon top-left */}
              <div
                className="absolute top-0 left-0 pointer-events-none select-none z-10 animate-slide-right"
                style={{ width: 160, height: 220, animationDelay: "100ms" }}
              >
                <svg viewBox="0 0 160 220" fill="none" stroke="#EAD5C3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                  {/* Bow loops */}
                  <path d="M 80 60 C 50 30, 10 25, 20 55 C 30 80, 75 72, 80 60 Z" />
                  <path d="M 80 60 C 55 40, 30 10, 55 20 C 75 28, 82 55, 80 60 Z" />
                  {/* Bow knot */}
                  <ellipse cx="80" cy="60" rx="7" ry="7" />
                  {/* Left ribbon tail */}
                  <path d="M 75 67 C 60 100, 20 140, 10 210" />
                  {/* Right ribbon tail */}
                  <path d="M 85 67 C 95 110, 80 160, 70 220" />
                  {/* Ribbon flutter lines */}
                  <path d="M 12 145 C 30 140, 25 155, 15 165" strokeWidth="0.8" opacity="0.5" />
                  <path d="M 65 175 C 80 168, 78 185, 68 195" strokeWidth="0.8" opacity="0.5" />
                </svg>
              </div>

              {/* Bow/Ribbon top-right */}
              <div
                className="absolute top-0 right-0 pointer-events-none select-none z-10 animate-slide-left"
                style={{ width: 160, height: 220, animationDelay: "100ms" }}
              >
                <svg viewBox="0 0 160 220" fill="none" stroke="#EAD5C3" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
                  {/* Bow loops (mirrored) */}
                  <path d="M 80 60 C 110 30, 150 25, 140 55 C 130 80, 85 72, 80 60 Z" />
                  <path d="M 80 60 C 105 40, 130 10, 105 20 C 85 28, 78 55, 80 60 Z" />
                  {/* Bow knot */}
                  <ellipse cx="80" cy="60" rx="7" ry="7" />
                  {/* Left ribbon tail */}
                  <path d="M 85 67 C 100 100, 140 140, 150 210" />
                  {/* Right ribbon tail */}
                  <path d="M 75 67 C 65 110, 80 160, 90 220" />
                  {/* Ribbon flutter lines */}
                  <path d="M 148 145 C 130 140, 135 155, 145 165" strokeWidth="0.8" opacity="0.5" />
                  <path d="M 95 175 C 80 168, 82 185, 92 195" strokeWidth="0.8" opacity="0.5" />
                </svg>
              </div>

              {/* Title */}
              <h2
                className="font-script text-6xl sm:text-7xl md:text-8xl text-[#EAD5C3] mb-10 sm:mb-14 tracking-wide z-10 animate-slide-down"
                style={{ animationDelay: "150ms" }}
              >
                Special for you
              </h2>

              {/* Four Lace Hearts Row — clickable, navigates to tabs */}
              <div className="flex flex-wrap gap-3 sm:gap-6 md:gap-10 items-end justify-center z-10 px-4">
                {[
                  { tab: "the",     label: "The",     delay: "220ms" },
                  { tab: "love",    label: "Love",    delay: "300ms" },
                  { tab: "of",      label: "of",      delay: "380ms" },
                  { tab: "my-life", label: "My life", delay: "460ms" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => switchTab(item.tab)}
                    className="group flex flex-col items-center gap-3 cursor-pointer focus:outline-none"
                    style={{ animation: `slideUpFade 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${item.delay} both` }}
                    aria-label={`Go to ${item.label}`}
                  >
                    {/* Heart SVG */}
                    <div
                      className="relative transition-transform duration-400 group-hover:scale-110 group-hover:-translate-y-2"
                      style={{ width: "clamp(85px,18vw,130px)", height: "clamp(85px,18vw,130px)", transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1)" }}
                    >
                      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                        <defs>
                          {/* Radial gradient for heart fill */}
                          <radialGradient id={`hg${i}`} cx="42%" cy="35%" r="65%">
                            <stop offset="0%" stopColor="#8A7068" stopOpacity="0.9" />
                            <stop offset="60%" stopColor="#6B5A56" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#4A3530" stopOpacity="0.95" />
                          </radialGradient>
                          {/* Glow filter for hover */}
                          <filter id={`glow${i}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Heart body with gradient */}
                        <path
                          d="M100 165 C100 165 22 116 22 64 C22 39 42 22 67 29 C82 33 100 50 100 50 C100 50 118 33 133 29 C158 22 178 39 178 64 C178 116 100 165 100 165Z"
                          fill={`url(#hg${i})`}
                        />

                        {/* Highlight shimmer at top-left */}
                        <path
                          d="M70 42 C78 32 96 30 105 38"
                          stroke="#EAD5C3"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeOpacity="0.18"
                          fill="none"
                        />

                        {/* Outer lace ring — larger circles spaced along heart */}
                        {Array.from({ length: 40 }).map((_, idx) => {
                          const t = (idx / 40) * 2 * Math.PI;
                          const hx = 100 + 61 * Math.pow(Math.sin(t), 3);
                          const hy = 100 - (50 * Math.cos(t) - 15 * Math.cos(2 * t) - 5.5 * Math.cos(3 * t) - 2 * Math.cos(4 * t));
                          const r = idx % 2 === 0 ? 3.8 : 2.6;
                          return <circle key={`o${idx}`} cx={hx} cy={hy} r={r} fill="#EAD5C3" opacity={idx % 2 === 0 ? 0.5 : 0.3} />;
                        })}

                        {/* Mid lace ring */}
                        {Array.from({ length: 32 }).map((_, idx) => {
                          const t = (idx / 32) * 2 * Math.PI;
                          const hx = 100 + 51 * Math.pow(Math.sin(t), 3);
                          const hy = 100 - (42 * Math.cos(t) - 12 * Math.cos(2 * t) - 4.5 * Math.cos(3 * t) - 1.8 * Math.cos(4 * t));
                          return <circle key={`m${idx}`} cx={hx} cy={hy} r="1.8" fill="#EAD5C3" opacity="0.25" />;
                        })}

                        {/* Inner petal detail — tiny arcs */}
                        {Array.from({ length: 16 }).map((_, idx) => {
                          const t = (idx / 16) * 2 * Math.PI;
                          const hx = 100 + 36 * Math.pow(Math.sin(t), 3);
                          const hy = 100 - (30 * Math.cos(t) - 9 * Math.cos(2 * t) - 3 * Math.cos(3 * t) - 1 * Math.cos(4 * t));
                          return <circle key={`p${idx}`} cx={hx} cy={hy} r="1.2" fill="#EAD5C3" opacity="0.15" />;
                        })}

                        {/* Outline stroke */}
                        <path
                          d="M100 165 C100 165 22 116 22 64 C22 39 42 22 67 29 C82 33 100 50 100 50 C100 50 118 33 133 29 C158 22 178 39 178 64 C178 116 100 165 100 165Z"
                          stroke="#EAD5C3"
                          strokeWidth="1.4"
                          strokeOpacity="0.4"
                          fill="none"
                        />

                        {/* Hover glow overlay — visible via CSS group */}
                        <path
                          d="M100 165 C100 165 22 116 22 64 C22 39 42 22 67 29 C82 33 100 50 100 50 C100 50 118 33 133 29 C158 22 178 39 178 64 C178 116 100 165 100 165Z"
                          stroke="#EAD5C3"
                          strokeWidth="3"
                          strokeOpacity="0"
                          fill="#EAD5C3"
                          fillOpacity="0"
                          className="group-hover:[stroke-opacity:0.25] group-hover:[fill-opacity:0.06] transition-all duration-300"
                        />
                      </svg>
                    </div>

                    {/* Label beneath heart */}
                    <span className="font-serif text-xs sm:text-sm text-[#EAD5C3]/60 group-hover:text-[#EAD5C3] tracking-widest uppercase transition-colors duration-300">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Back Arrow Button */}
              <button
                onClick={() => switchTab("happy-birthday")}
                className="mt-10 sm:mt-14 px-8 py-3 rounded-full border border-[#EAD5C3]/40 text-[#EAD5C3]/70 hover:border-[#EAD5C3] hover:text-[#EAD5C3] hover:bg-[#EAD5C3]/10 transition-all duration-300 cursor-pointer flex items-center gap-2 z-10"
              >
                <span className="text-xl">←</span>
              </button>
            </div>
          )}


          {/* THE TAB: Full-screen photo gallery / message slider */}
          {activeTab === "the" && (
            <div className="fixed inset-0 z-50 overflow-hidden flex flex-col md:flex-row" style={{ background: "#3A2825" }}>

              {/* Right panel — burgundy textured fabric bg (full width on mobile) */}
              <div
                className="absolute right-0 top-0 bottom-0 w-full md:w-[55%] animate-fade-in"
                style={{
                  background: "repeating-linear-gradient(135deg, #5C1F1F 0px, #5C1F1F 2px, #6B2525 2px, #6B2525 6px, #5C1F1F 6px, #5C1F1F 8px)",
                  animationDelay: "100ms",
                }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    background: "repeating-linear-gradient(45deg, transparent 0px, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 5px)",
                  }}
                />
              </div>

              {/* Message Slider — overlapping both panels */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-4 py-20 overflow-y-auto">
                <div className="relative w-full max-w-xl mx-auto flex flex-col items-center gap-6 animate-scale-up" style={{ animationDelay: "200ms" }}>
                  
                  {/* Scrapbook / Vintage backing paper */}
                  <div className="relative w-full p-4 sm:p-6 rounded-2xl bg-[#EAD5C3] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#C6B3A2] overflow-hidden">
                    {/* Binder ring holes on the left side (notebook look) */}
                    <div className="absolute left-2 top-0 bottom-0 flex flex-col justify-around py-4 pointer-events-none opacity-40">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="w-3 h-3 rounded-full bg-[#3A2825] border border-white/20" />
                      ))}
                    </div>

                    {/* Slider viewport */}
                    <div className="relative overflow-hidden w-full pl-6 rounded-lg">
                      <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                      >
                        {slides.map((slide) => (
                          <div
                            key={slide.id}
                            className="w-full shrink-0 px-2 sm:px-4 py-2 select-none cursor-grab active:cursor-grabbing"
                          >
                            {/* Card Body */}
                            <div className={`relative w-full aspect-[4/3] sm:aspect-[16/11] bg-gradient-to-br ${slide.bgClass} p-6 sm:p-8 rounded-xl shadow-md border-2 ${slide.borderClass} flex flex-col justify-between overflow-hidden transition-transform duration-300 hover:rotate-1`}>
                              
                              {/* Diagonal Stamp in top right corner */}
                              <div className="absolute -top-1 -right-1 w-14 h-14 opacity-20 pointer-events-none">
                                <svg viewBox="0 0 100 100" fill="currentColor">
                                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                                  <text x="50" y="55" textAnchor="middle" fontSize="12" fontWeight="bold">POST</text>
                                </svg>
                              </div>

                              {/* Decorative corner stars */}
                              <div className="absolute top-2.5 left-2.5 text-xs" style={{ color: slide.accentColor }}>✦</div>
                              <div className="absolute top-2.5 right-2.5 text-xs" style={{ color: slide.accentColor }}>✦</div>
                              <div className="absolute bottom-2.5 left-2.5 text-xs" style={{ color: slide.accentColor }}>✦</div>
                              <div className="absolute bottom-2.5 right-2.5 text-xs" style={{ color: slide.accentColor }}>✦</div>

                              {/* Card Header */}
                              <div className="flex items-center justify-center gap-2 sm:gap-3">
                                <span className="text-2xl sm:text-3xl animate-pulse">{slide.decor}</span>
                                <h3 className="font-script text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide" style={{ color: slide.accentColor }}>
                                  {slide.title}
                                </h3>
                              </div>

                              {/* Card Body Message */}
                              <div className="flex-1 flex items-center justify-center py-2 sm:py-4 px-2 sm:px-4">
                                <p className="font-serif text-sm sm:text-base md:text-lg text-center leading-relaxed italic font-medium opacity-90 select-text">
                                  "{slide.message}"
                                </p>
                              </div>

                              {/* Card Footer */}
                              <div
                                className="flex justify-between items-center text-[10px] sm:text-xs tracking-widest font-sans uppercase font-semibold opacity-60 border-t pt-3"
                                style={{ borderColor: `${slide.accentColor}25`, color: slide.accentColor }}
                              >
                                <span>UNTUKMU ❤️</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation & Controls Section */}
                  <div className="w-full flex items-center justify-between px-2">
                    {/* Left Button */}
                    <button
                      onClick={prevSlide}
                      className="w-10 h-10 rounded-full bg-[#EAD5C3]/10 hover:bg-[#EAD5C3]/20 border border-[#EAD5C3]/30 hover:border-[#EAD5C3] text-[#EAD5C3] flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer shadow-md"
                      aria-label="Previous message"
                    >
                      <span className="text-lg">←</span>
                    </button>

                    {/* Dot Indicators */}
                    <div className="flex gap-2.5">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                            currentSlide === idx ? "w-6 bg-[#EAD5C3]" : "w-2.5 bg-[#EAD5C3]/40 hover:bg-[#EAD5C3]/75"
                          }`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    {/* Right Button */}
                    <button
                      onClick={nextSlide}
                      className="w-10 h-10 rounded-full bg-[#EAD5C3]/10 hover:bg-[#EAD5C3]/20 border border-[#EAD5C3]/30 hover:border-[#EAD5C3] text-[#EAD5C3] flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer shadow-md"
                      aria-label="Next message"
                    >
                      <span className="text-lg">→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Back Arrow Button */}
              <button
                onClick={() => switchTab("to")}
                className="absolute bottom-7 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full border border-[#EAD5C3]/50 text-[#EAD5C3]/80 hover:border-[#EAD5C3] hover:text-[#EAD5C3] hover:bg-[#EAD5C3]/10 transition-all duration-300 cursor-pointer flex items-center gap-2 z-30 animate-slide-up"
                style={{ animationDelay: "600ms" }}
              >
                <span className="text-xl">←</span>
              </button>
            </div>
          )}
          {/* LOVE TAB: "This song is for you" — YouTube with lace frame */}
          {activeTab === "love" && (
            <div className="fixed inset-0 z-50 overflow-hidden flex" style={{ background: "#3A2825" }}>

              {/* Left panel — cream cable-knit texture */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[18%] animate-slide-right"
                style={{
                  animationDelay: "100ms",
                  background: "#E8DDD0",
                  backgroundImage: `
                    repeating-linear-gradient(
                      90deg,
                      transparent 0px, transparent 6px,
                      rgba(180,160,140,0.15) 6px, rgba(180,160,140,0.15) 7px
                    ),
                    repeating-linear-gradient(
                      180deg,
                      transparent 0px, transparent 10px,
                      rgba(180,160,140,0.1) 10px, rgba(180,160,140,0.1) 11px
                    )
                  `,
                }}
              >
                {/* Cable knit vertical ribbing */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: `${8 + i * 11.5}%`,
                      width: 4,
                      background: "rgba(160,140,120,0.18)",
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>

              {/* Right panel — dark burgundy fabric texture */}
              <div
                className="absolute right-0 top-0 bottom-0 w-[82%] animate-slide-left"
                style={{
                  animationDelay: "100ms",
                  background: "repeating-linear-gradient(135deg, #5C1F1F 0px, #5C1F1F 2px, #6B2525 2px, #6B2525 6px, #5C1F1F 6px, #5C1F1F 8px)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    background: "repeating-linear-gradient(45deg, transparent 0px, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 5px)",
                  }}
                />
              </div>

              {/* Content — centered over right panel */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-8 pt-28 pb-20 overflow-y-auto">

                {/* Script title */}
                <h2
                  className="font-script text-[clamp(2rem,5vw,4.5rem)] text-[#EAD5C3]/90 tracking-wide select-none animate-slide-down"
                  style={{
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                    animationDelay: "200ms",
                  }}
                >
                  This song is for you
                </h2>

                {/* Lace-framed YouTube embed */}
                <div
                  className="relative animate-scale-up"
                  style={{ animationDelay: "300ms" }}
                >
                  {/* SVG lace border layer */}
                  <svg
                    className="absolute inset-0 pointer-events-none z-10"
                    viewBox="0 0 680 420"
                    style={{ width: "100%", height: "100%" }}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Outer scallop lace — top */}
                    {Array.from({ length: 34 }).map((_, i) => {
                      const cx = 20 + i * 19;
                      return (
                        <g key={`t${i}`}>
                          <circle cx={cx} cy={14} r={i % 2 === 0 ? 8 : 6} fill="#F5EDE0" opacity={i % 2 === 0 ? 0.85 : 0.65} />
                          <circle cx={cx} cy={14} r={i % 2 === 0 ? 4 : 3} fill="#F5EDE0" opacity="0.5" />
                        </g>
                      );
                    })}
                    {/* Outer scallop lace — bottom */}
                    {Array.from({ length: 34 }).map((_, i) => {
                      const cx = 20 + i * 19;
                      return (
                        <g key={`b${i}`}>
                          <circle cx={cx} cy={406} r={i % 2 === 0 ? 8 : 6} fill="#F5EDE0" opacity={i % 2 === 0 ? 0.85 : 0.65} />
                          <circle cx={cx} cy={406} r={i % 2 === 0 ? 4 : 3} fill="#F5EDE0" opacity="0.5" />
                        </g>
                      );
                    })}
                    {/* Outer scallop lace — left */}
                    {Array.from({ length: 20 }).map((_, i) => {
                      const cy = 20 + i * 19;
                      return (
                        <g key={`l${i}`}>
                          <circle cx={14} cy={cy} r={i % 2 === 0 ? 8 : 6} fill="#F5EDE0" opacity={i % 2 === 0 ? 0.85 : 0.65} />
                          <circle cx={14} cy={cy} r={i % 2 === 0 ? 4 : 3} fill="#F5EDE0" opacity="0.5" />
                        </g>
                      );
                    })}
                    {/* Outer scallop lace — right */}
                    {Array.from({ length: 20 }).map((_, i) => {
                      const cy = 20 + i * 19;
                      return (
                        <g key={`r${i}`}>
                          <circle cx={666} cy={cy} r={i % 2 === 0 ? 8 : 6} fill="#F5EDE0" opacity={i % 2 === 0 ? 0.85 : 0.65} />
                          <circle cx={666} cy={cy} r={i % 2 === 0 ? 4 : 3} fill="#F5EDE0" opacity="0.5" />
                        </g>
                      );
                    })}

                    {/* Inner lace ring — small dots */}
                    {Array.from({ length: 30 }).map((_, i) => <circle key={`it${i}`} cx={30 + i * 21} cy={26} r="2.5" fill="#F5EDE0" opacity="0.4" />)}
                    {Array.from({ length: 30 }).map((_, i) => <circle key={`ib${i}`} cx={30 + i * 21} cy={394} r="2.5" fill="#F5EDE0" opacity="0.4" />)}
                    {Array.from({ length: 18 }).map((_, i) => <circle key={`il${i}`} cx={26} cy={30 + i * 21} r="2.5" fill="#F5EDE0" opacity="0.4" />)}
                    {Array.from({ length: 18 }).map((_, i) => <circle key={`ir${i}`} cx={654} cy={30 + i * 21} r="2.5" fill="#F5EDE0" opacity="0.4" />)}

                    {/* Corner floral diamonds */}
                    {[[28, 28], [652, 28], [28, 392], [652, 392]].map(([cx, cy], ci) => (
                      <g key={`c${ci}`}>
                        <rect x={cx - 10} y={cy - 10} width={20} height={20} fill="#F5EDE0" opacity="0.5" transform={`rotate(45,${cx},${cy})`} />
                        <rect x={cx - 6} y={cy - 6} width={12} height={12} fill="#F5EDE0" opacity="0.65" transform={`rotate(45,${cx},${cy})`} />
                        <circle cx={cx} cy={cy} r="4" fill="#F5EDE0" opacity="0.8" />
                      </g>
                    ))}
                  </svg>

                  {/* YouTube iframe */}
                  <div
                    className="relative"
                    style={{ width: "min(640px, 94vw)", aspectRatio: "16/9", padding: "clamp(10px,3vw,28px)", background: "rgba(30,15,10,0.6)" }}
                  >
                    <iframe
                      src="https://www.youtube.com/embed/DNRmkDzCFmA?si=auto"
                      title="This song is for you"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-sm"
                      style={{ border: "none", display: "block" }}
                    />
                  </div>
                </div>
              </div>

              {/* Back Arrow Button */}
              <button
                onClick={() => switchTab("to")}
                className="absolute bottom-7 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full border border-[#EAD5C3]/50 text-[#EAD5C3]/80 hover:border-[#EAD5C3] hover:text-[#EAD5C3] hover:bg-[#EAD5C3]/10 transition-all duration-300 cursor-pointer flex items-center gap-2 z-30 animate-slide-up"
                style={{ animationDelay: "500ms" }}
              >
                <span className="text-xl">←</span>
              </button>
            </div>
          )}
          {/* OF TAB: "of" — Birthday Privileges coupon tickets */}
          {activeTab === "of" && (
            <div className="fixed inset-0 z-50 overflow-hidden flex bg-[#3E2E2B]">
              
              {/* Embossed Lace Panel on the Right */}
              <div className="absolute right-0 top-0 bottom-0 w-[15%] hidden md:block overflow-hidden pointer-events-none select-none z-10">
                <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 120 800">
                  <rect width="100%" height="100%" fill="#EBD8C8" />
                  <line x1="0" y1="0" x2="0" y2="800" stroke="#FFF" strokeWidth="2" opacity="0.4" />
                  <line x1="2" y1="0" x2="2" y2="800" stroke="#8A6E59" strokeWidth="1" opacity="0.2" />

                  {/* Repeating embossed floral pattern */}
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const yOffset = idx * 140 + 30;
                    return (
                      <g key={idx} transform={`translate(10, ${yOffset})`}>
                        {/* Embossed shadow */}
                        <path
                          d="M 50 10 C 30 10, 10 25, 10 50 C 10 75, 30 90, 50 90 C 70 90, 90 75, 90 50 C 90 25, 70 10, 50 10 Z 
                             M 50 20 C 65 20, 80 32, 80 50 C 80 68, 65 80, 50 80 C 35 80, 20 68, 20 50 C 20 32, 35 20, 50 20 Z"
                          stroke="#5C4233"
                          strokeWidth="1.5"
                          opacity="0.12"
                          fill="none"
                        />
                        <path
                          d="M 50 35 C 42 35, 35 42, 35 50 C 35 58, 42 65, 50 65 C 58 65, 65 58, 65 50 C 65 42, 58 35, 50 35 Z"
                          stroke="#5C4233"
                          strokeWidth="1"
                          opacity="0.12"
                          fill="none"
                        />
                        <path
                          d="M 49 9 C 29 9, 9 24, 9 49 C 9 74, 29 89, 49 89 C 69 89, 89 74, 89 49 C 89 24, 69 9, 49 9 Z 
                             M 49 19 C 64 19, 79 31, 79 49 C 79 67, 64 79, 49 79 C 34 79, 19 67, 19 49 C 19 31, 34 19, 49 19 Z"
                          stroke="#FFF"
                          strokeWidth="1.5"
                          opacity="0.55"
                          fill="none"
                        />
                        <path
                          d="M 49 34 C 41 34, 34 41, 34 49 C 34 57, 41 64, 49 64 C 57 64, 64 57, 64 49 C 64 41, 57 34, 49 34 Z"
                          stroke="#FFF"
                          strokeWidth="1"
                          opacity="0.55"
                          fill="none"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Decorative Flowers and Twigs Background */}
              <div className="absolute inset-0 -z-10 pointer-events-none select-none opacity-40 md:opacity-50">
                {/* Left flower */}
                <div className="absolute top-16 left-6 md:left-20 w-44 sm:w-60 h-44 sm:h-60">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <path d="M100 100 Q60 50, 40 40 T20 60 Q30 90, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q80 40, 90 20 T120 30 Q130 60, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q120 50, 150 40 T170 70 Q140 90, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q130 90, 160 110 T150 140 Q110 130, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q90 140, 90 170 T60 160 Q50 120, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q50 110, 30 130 T40 150 Q70 140, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q90 70, 75 55" stroke="#EAD5C3" strokeWidth="1.5" fill="none" />
                    <circle cx="75" cy="55" r="2" fill="#EAD5C3" />
                    <path d="M100 100 Q96 72, 92 50" stroke="#EAD5C3" strokeWidth="1.5" fill="none" />
                    <circle cx="92" cy="50" r="2" fill="#EAD5C3" />
                    <path d="M100 100 Q105 72, 115 55" stroke="#EAD5C3" strokeWidth="1.5" fill="none" />
                    <circle cx="115" cy="55" r="2" fill="#EAD5C3" />
                  </svg>
                </div>

                {/* Right flower */}
                <div className="absolute top-10 right-[18%] md:right-[22%] w-44 sm:w-60 h-44 sm:h-60">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform rotate-45 scale-x-[-1]">
                    <path d="M100 100 Q60 50, 40 40 T20 60 Q30 90, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q80 40, 90 20 T120 30 Q130 60, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q120 50, 150 40 T170 70 Q140 90, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q130 90, 160 110 T150 140 Q110 130, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q90 140, 90 170 T60 160 Q50 120, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q50 110, 30 130 T40 150 Q70 140, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q90 70, 75 55" stroke="#EAD5C3" strokeWidth="1.5" fill="none" />
                    <circle cx="75" cy="55" r="2" fill="#EAD5C3" />
                    <path d="M100 100 Q96 72, 92 50" stroke="#EAD5C3" strokeWidth="1.5" fill="none" />
                    <circle cx="92" cy="50" r="2" fill="#EAD5C3" />
                  </svg>
                </div>

                {/* Stems/Twigs with purple flowers */}
                <svg viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full" fill="none">
                  <path d="M 80 450 Q 230 380, 180 300 T 130 120" stroke="#2B1A1A" strokeWidth="1.5" />
                  <circle cx="140" cy="200" r="3.5" fill="#6E5568" />
                  <circle cx="195" cy="330" r="3.5" fill="#6E5568" />
                  <circle cx="185" cy="260" r="3" fill="#6E5568" />
                  
                  <path d="M 720 450 Q 580 350, 630 280 T 710 140" stroke="#2B1A1A" strokeWidth="1.5" />
                  <circle cx="650" cy="310" r="3.5" fill="#6E5568" />
                  <circle cx="620" cy="260" r="3.5" fill="#6E5568" />
                  <circle cx="670" cy="200" r="3" fill="#6E5568" />

                  <path d="M 430 340 Q 460 290, 400 240" stroke="#2B1A1A" strokeWidth="1" />
                  <circle cx="415" cy="265" r="3.5" fill="#6E5568" />
                  <circle cx="448" cy="310" r="2.5" fill="#6E5568" />
                </svg>
              </div>

              {/* Content — Centered */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 sm:gap-8 md:gap-10 px-4 sm:px-8 pt-28 pb-20 sm:py-16 overflow-y-auto">
                
                {/* Title */}
                <h2
                  className="font-script text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#EAD5C3] text-center tracking-wide animate-slide-down"
                  style={{ animationDelay: "200ms" }}
                >
                  Birthday Privileges
                </h2>

                {/* 2x2 Ticket Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl justify-items-center">
                  {[
                    { id: 0, title: "MOVIE NIGHT" },
                    { id: 1, title: "GAME MARATHON" },
                    { id: 2, title: "FREE GIFT" },
                    { id: 3, title: "'YES' DAY" },
                  ].map((ticket) => {
                    const isClaimed = !!claimedTickets[ticket.id];
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          if (!isClaimed) {
                            setClaimedTickets((prev) => ({ ...prev, [ticket.id]: true }));
                            
                            // Play romantic claimed note
                            if (audioCtxRef.current) {
                              const time = audioCtxRef.current.currentTime;
                              const osc1 = audioCtxRef.current.createOscillator();
                              const osc2 = audioCtxRef.current.createOscillator();
                              const gain = audioCtxRef.current.createGain();
                              
                              osc1.type = "sine";
                              osc2.type = "sine";
                              osc1.frequency.setValueAtTime(523.25, time); // C5
                              osc2.frequency.setValueAtTime(659.25, time + 0.08); // E5
                              
                              gain.gain.setValueAtTime(0, time);
                              gain.gain.linearRampToValueAtTime(0.04, time + 0.04);
                              gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
                              
                              osc1.connect(gain);
                              osc2.connect(gain);
                              gain.connect(audioCtxRef.current.destination);
                              
                              osc1.start(time);
                              osc2.start(time + 0.08);
                              osc1.stop(time + 0.5);
                              osc2.stop(time + 0.5);
                            }
                          }
                        }}
                        className={`relative cursor-pointer select-none group transition-all duration-300 animate-scale-up ${
                          isClaimed ? "opacity-75 scale-[0.98]" : "hover:scale-[1.02] hover:-translate-y-0.5"
                        }`}
                        style={{
                          width: "clamp(240px, 80vw, 300px)",
                          height: "clamp(110px, 30vw, 135px)",
                          animationDelay: `${250 + ticket.id * 85}ms`,
                        }}
                      >
                        {/* SVG Ticket Template with high-fidelity path notches */}
                        <svg
                          viewBox="0 0 300 135"
                          className="w-full h-full drop-shadow-md text-[#F5EDE0] fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M 10 0
                               H 210
                               A 8 8 0 0 0 226 0
                               H 290
                               A 10 10 0 0 1 300 10
                               V 57.5
                               A 10 10 0 0 0 300 77.5
                               V 125
                               A 10 10 0 0 1 290 135
                               H 226
                               A 8 8 0 0 0 210 135
                               H 10
                               A 10 10 0 0 1 0 125
                               V 77.5
                               A 10 10 0 0 0 0 57.5
                               V 10
                               A 10 10 0 0 1 10 0
                               Z"
                          />
                          
                          {/* Perforation vertical dotted line */}
                          <line
                            x1="218"
                            y1="8"
                            x2="218"
                            y2="127"
                            stroke="#3E2E2B"
                            strokeWidth="1.8"
                            strokeDasharray="4 5"
                            opacity="0.45"
                          />
                        </svg>

                        {/* Ticket Content Container */}
                        <div className="absolute inset-0 flex text-[#3E2E2B]">
                          <div className="w-[218px] flex items-center justify-center px-4">
                            <span className="font-serif text-lg sm:text-2xl font-bold tracking-widest text-center leading-tight">
                              {ticket.title}
                            </span>
                          </div>

                          {/* Right area: Vertical Barcode stub */}
                          <div className="w-[82px] flex items-center justify-center gap-2 pr-2 relative">
                            {/* Barcode lines */}
                            <div className="flex items-center gap-[1.5px] opacity-75 h-[80px]">
                              {[2, 1, 3, 1, 4, 1, 2, 1, 3, 2, 1, 4, 2].map((w, idx) => (
                                <div
                                  key={idx}
                                  className="bg-[#3E2E2B] h-full"
                                  style={{ width: `${w * 0.8}px` }}
                                />
                              ))}
                            </div>
                            
                            {/* Vertical numbers stub rotated */}
                            <span
                              className="font-sans text-[7.5px] tracking-widest uppercase opacity-75 select-none"
                              style={{
                                writingMode: "vertical-rl",
                                transform: "rotate(180deg)",
                              }}
                            >
                              0 123456 789111
                            </span>
                          </div>
                        </div>

                        {/* Red Ink APPROVED / CLAIMED Stamp Overlay */}
                        {isClaimed && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-scale-up">
                            <div
                              className="border-[3px] border-double border-[#A52A2A] text-[#A52A2A] px-4 py-1.5 rounded font-serif text-lg font-bold tracking-widest uppercase transform -rotate-12 bg-[#F5EDE0] shadow-sm flex flex-col items-center justify-center leading-none"
                              style={{
                                transform: "rotate(-12deg) scale(1.1)",
                              }}
                            >
                              <span>CLAIMED</span>
                              <span className="text-[9px] tracking-widest mt-1">APPROVED</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Back Button */}
                <button
                  onClick={() => switchTab("to")}
                  className="px-8 py-3 rounded-full border border-[#EAD5C3]/40 text-[#EAD5C3]/70 hover:border-[#EAD5C3] hover:text-[#EAD5C3] hover:bg-[#EAD5C3]/10 transition-all duration-300 cursor-pointer flex items-center gap-2 z-10 animate-slide-up"
                  style={{ animationDelay: "600ms" }}
                >
                  <span className="text-xl">←</span>
                </button>
              </div>
            </div>
          )}


          {/* MY LIFE TAB: "My life" — Letter and Photo filmstrips */}
          {activeTab === "my-life" && (
            <div className="fixed inset-0 z-50 overflow-hidden flex bg-[#3E2E2B]">
              
              {/* Vertical Gingham Plaid Panel on the Left */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[35%] hidden md:block z-10"
                style={{
                  backgroundColor: "#9A3B3C",
                  backgroundImage: `
                    linear-gradient(90deg, rgba(245, 237, 224, 0.85) 50%, transparent 50%),
                    linear-gradient(rgba(245, 237, 224, 0.85) 50%, transparent 50%)
                  `,
                  backgroundSize: "12px 12px",
                }}
              />

              {/* Decorative Flowers behind Photo Strips (Right Side) */}
              <div className="absolute inset-0 -z-10 pointer-events-none select-none opacity-40 md:opacity-50">
                {/* Dark Lily Flower under/behind strips */}
                <div className="absolute top-[40%] right-[15%] w-44 sm:w-56 h-44 sm:h-56">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform rotate-[25deg]">
                    <path d="M100 100 Q60 50, 40 40 T20 60 Q30 90, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q80 40, 90 20 T120 30 Q130 60, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q120 50, 150 40 T170 70 Q140 90, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q130 90, 160 110 T150 140 Q110 130, 100 100" fill="#3B0D0D" />
                    <path d="M100 100 Q90 140, 90 170 T60 160 Q50 120, 100 100" fill="#2E0A0A" />
                    <path d="M100 100 Q50 110, 30 130 T40 150 Q70 140, 100 100" fill="#3B0D0D" />
                  </svg>
                </div>

                {/* Stems/Twigs with purple flowers */}
                <svg viewBox="0 0 1000 600" className="absolute inset-0 w-full h-full" fill="none">
                  <path d="M 450 120 Q 550 180, 520 280 T 580 450" stroke="#2B1A1A" strokeWidth="1.5" />
                  <circle cx="530" cy="200" r="3.5" fill="#6E5568" />
                  <circle cx="560" cy="300" r="3.5" fill="#6E5568" />
                  <circle cx="570" cy="370" r="3" fill="#6E5568" />
                </svg>
              </div>

              {/* Main Content Layout */}
              <div className="absolute inset-0 z-20 flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-12 md:gap-16 px-4 sm:px-6 pt-28 pb-20 md:py-12 overflow-y-auto">
                
                {/* Left Side: Interactive Envelope, Doily, and Postage Letter */}
                <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[380px] h-[280px] sm:h-[340px] mt-6 md:mt-0">
                  
                  {/* Envelope Base Container */}
                  <div className={`relative w-[260px] sm:w-[310px] h-[200px] sm:h-[250px] transition-all duration-700 ${isEnvelopeOpened ? "translate-y-24 scale-95" : "hover:-translate-y-1 hover:rotate-1 cursor-pointer"}`}>
                    
                    {/* SVG Envelope */}
                    <svg viewBox="0 0 300 240" className="w-full h-full drop-shadow-lg text-[#EADCC9]" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      {/* Back Panel */}
                      <path d="M 10 90 L 10 230 L 290 230 L 290 90 L 150 150 Z" fill="#D3C1AD" />

                      {/* Top Flap — points up when opened, down when closed */}
                      {isEnvelopeOpened ? (
                        <path d="M 10 90 L 150 10 L 290 90 Z" fill="#F4ECE2" className="transition-all duration-700 origin-top" />
                      ) : (
                        <path d="M 10 90 L 150 170 L 290 90 Z" fill="#C4B29E" className="transition-all duration-700 origin-top" />
                      )}
                      
                      {/* Side fold overlays */}
                      <path d="M 10 90 L 120 160 L 10 230 Z" fill="#DFCEBA" />
                      <path d="M 290 90 L 180 160 L 290 230 Z" fill="#DFCEBA" />
                      
                      {/* Bottom fold overlay */}
                      <path d="M 10 230 L 150 135 L 290 230 Z" fill="#D8C7B3" />
                    </svg>

                    {/* Wax Seal Button (only when closed) */}
                    {!isEnvelopeOpened && (
                      <button
                        onClick={() => {
                          setIsEnvelopeOpened(true);
                          
                          // Play chime progression
                          if (audioCtxRef.current) {
                            const time = audioCtxRef.current.currentTime;
                            const osc1 = audioCtxRef.current.createOscillator();
                            const osc2 = audioCtxRef.current.createOscillator();
                            const gain = audioCtxRef.current.createGain();
                            osc1.type = "sine";
                            osc2.type = "sine";
                            osc1.frequency.setValueAtTime(523.25, time); // C5
                            osc2.frequency.setValueAtTime(659.25, time + 0.1); // E5
                            gain.gain.setValueAtTime(0, time);
                            gain.gain.linearRampToValueAtTime(0.04, time + 0.05);
                            gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
                            osc1.connect(gain);
                            osc2.connect(gain);
                            gain.connect(audioCtxRef.current.destination);
                            osc1.start(time);
                            osc2.start(time + 0.1);
                            osc1.stop(time + 0.6);
                            osc2.stop(time + 0.6);
                          }
                        }}
                        className="absolute top-[125px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#B03A2E] hover:bg-[#C0392B] border-2 border-[#EAD5C3] shadow-md flex items-center justify-center text-white text-lg font-bold transition-all duration-300 hover:scale-110 cursor-pointer animate-pulse z-30"
                        title="Click to Open Letter"
                      >
                        ❤️
                      </button>
                    )}
                  </div>

                  {/* doily (slides up out of envelope when opened) */}
                  <div className={`absolute w-[120px] sm:w-[160px] h-[120px] sm:h-[160px] select-none pointer-events-none transition-all duration-700 ease-in-out ${isEnvelopeOpened ? "-translate-y-[60px] sm:-translate-y-[80px] -translate-x-10 sm:-translate-x-14 rotate-6 opacity-85 z-15 scale-100" : "translate-y-[30px] opacity-0 scale-50 z-0"}`}>
                    <svg viewBox="0 0 160 160" className="w-full h-full text-[#F5EDE0] fill-current">
                      <circle cx="80" cy="80" r="70" stroke="#F5EDE0" strokeWidth="1" strokeDasharray="3 3" fill="#FDFBF7" />
                      {Array.from({ length: 30 }).map((_, i) => {
                        const angle = (i / 30) * 2 * Math.PI;
                        const cx = 80 + 71 * Math.cos(angle);
                        const cy = 80 + 71 * Math.sin(angle);
                        return (
                          <g key={i}>
                            <circle cx={cx} cy={cy} r="6.5" fill="#F5EDE0" />
                            <circle cx={cx} cy={cy} r="3" fill="#3E2E2B" opacity="0.15" />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Scalloped Postage Stamp Letter Card (slides up and expands) */}
                  <div className={`absolute w-[290px] sm:w-[385px] h-[200px] sm:h-[270px] transition-all duration-700 ease-out flex flex-col justify-between p-4 sm:p-6 ${isEnvelopeOpened ? "-translate-y-[80px] sm:-translate-y-[100px] scale-[1.06] sm:scale-[1.08] md:scale-[1.12] rotate-0 opacity-100 z-25" : "translate-y-[30px] scale-50 opacity-0 z-0 pointer-events-none"}`}>
                    {/* Scalloped background */}
                    <div className="absolute inset-0 -z-10 select-none pointer-events-none">
                      <svg viewBox="0 0 385 270" className="w-full h-full drop-shadow-xl text-[#FDFBF8] fill-current">
                        <path d={getStampPath(385, 270, 4, 12)} />
                      </svg>
                    </div>

                    {/* Letter Content */}
                    <div className="text-[#3E2E2B] font-script text-left h-full flex flex-col justify-between pt-1">
                      <p className="select-text pr-10 sm:pr-14 pl-1 sm:pl-2 pt-1 text-[12px] sm:text-[15px] md:text-[16.5px] leading-[1.35] sm:leading-[1.4] md:leading-[1.55]">
                        Happy birthday, my love. I'm so grateful for you – for your patience, your kindness, and the way you always make things feel lighter just by being around. Thank you for choosing me every day and for loving me in the quiet, simple ways that mean the most. I hope this year brings you everything you've been working toward, and I'll be right here cheering you on, always.
                      </p>
                      
                      {/* Postmark stamp */}
                      <div className="absolute bottom-4 right-4 flex items-center select-none pointer-events-none opacity-85">
                        <svg className="w-[50px] h-[30px] text-[#4E3D3A] opacity-60 mr-1" fill="none" stroke="currentColor" strokeWidth="0.8">
                          <path d="M 0 5 Q 12 1, 25 5 T 50 5" />
                          <path d="M 0 13 Q 12 9, 25 13 T 50 13" />
                          <path d="M 0 21 Q 12 17, 25 21 T 50 21" />
                        </svg>
                        
                        <div className="relative w-12 h-12 rounded-full border border-[#4E3D3A] flex items-center justify-center">
                          <div className="w-[42px] h-[42px] rounded-full border border-[#4E3D3A]/70 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#4E3D3A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                              <path d="M 12 12 C 7 7, 3 9, 3 13 C 3 17, 8 15, 12 12 Z" />
                              <path d="M 12 12 C 17 7, 21 9, 21 13 C 21 17, 16 15, 12 12 Z" />
                              <ellipse cx="12" cy="12" rx="2" ry="2" fill="currentColor" />
                              <path d="M 11 13 Q 9 20, 6 22" />
                              <path d="M 13 13 Q 15 20, 18 22" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Two Photo Strips (Fade and slide in after envelope is opened) */}
                <div className={`flex gap-3 sm:gap-4 items-center justify-center transition-all duration-700 ease-out ${isEnvelopeOpened ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-12 scale-95 pointer-events-none"}`} style={{ transitionDelay: isEnvelopeOpened ? "300ms" : "0ms" }}>
                  {/* Strip 1: Cream filmstrip */}
                  <PhotoStrip
                    photos={["/assets/photo1.jpg", "/assets/photo5.jpg", "/assets/photo6.jpg"]}
                    bgStyle={{ backgroundColor: "#F7F3EA" }}
                    rotateClass="rotate-0 hover:-rotate-1"
                  />

                  {/* Strip 2: Pink patterned filmstrip */}
                  <PhotoStrip
                    photos={["/assets/photo2.jpg", "/assets/photo8.jpg", "/assets/photo9.jpg"]}
                    bgStyle={{
                      backgroundColor: "#F5E5E9",
                      backgroundImage: "radial-gradient(#C6B3B9 0.5px, transparent 0.5px)",
                      backgroundSize: "6px 6px",
                    }}
                    rotateClass="rotate-6 hover:rotate-3 translate-x-1"
                  />
                </div>
              </div>


              {/* Home Navigation button at the bottom center */}
              <button
                onClick={() => switchTab("to")}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#F5EDE0] hover:bg-white text-[#3E2E2B] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 cursor-pointer z-30 animate-slide-up"
                style={{ animationDelay: "550ms" }}
                aria-label="Go to home"
              >
                {/* SVG Home Icon */}
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </button>
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
