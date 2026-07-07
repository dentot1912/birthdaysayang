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
        <rect x={padding} y={padding} width={w} height={h} fill="#111111" rx="2" />

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
          <div key={idx} className="w-1.5 h-2.5 bg-[#080808] rounded-[1px] opacity-90" />
        ))}
      </div>
      
      {/* Film sprocket holes right */}
      <div className="absolute right-[3px] top-0 bottom-0 flex flex-col justify-between py-3 pointer-events-none z-30">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="w-1.5 h-2.5 bg-[#080808] rounded-[1px] opacity-90" />
        ))}
      </div>

      {photos.map((src, i) => (
        <div key={i} className="relative w-full h-[85px] bg-[#111111] overflow-hidden rounded-[1px] border border-black/15 shadow-inner">
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
        background: "radial-gradient(ellipse at center, #111 0%, #080808 100%)",
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
    bgClass: "from-[#FDFBF7] to-[#F5ECE2] text-[#111111]",
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
    bgClass: "from-[#FAF0E6] to-[#EEDC9A]/20 text-[#111111]",
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
  const [aboutYouHearts, setAboutYouHearts] = useState<{ id: number; x: number; y: number; emoji: string; size: number }[]>([]);

  const spawnAboutYouHeart = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const emojis = ["❤️", "💖", "✨", "🌸", "💕", "💘", "🌹", "💗"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const randomSize = Math.floor(Math.random() * 16) + 16;
    const newHeart = {
      id: Date.now() + Math.random(),
      x,
      y,
      emoji: randomEmoji,
      size: randomSize
    };
    setAboutYouHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setAboutYouHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2000);

    if (audioCtxRef.current) {
      try {
        const time = audioCtxRef.current.currentTime;
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = "sine";
        const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];
        osc.frequency.setValueAtTime(randomFreq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.015, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start(time);
        osc.stop(time + 0.6);
      } catch (err) {}
    }
  };


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
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#080808] text-[#EAD5C3] px-4 py-4 sm:px-6 sm:py-6 md:px-16 md:py-10">
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
                  className="px-8 py-3 rounded-full bg-[#1A1A1A] text-[#EAD5C3] font-serif text-sm tracking-widest uppercase underline underline-offset-4 decoration-1 hover:bg-[#2A2A2A] hover:text-white transition-all duration-300 shadow-lg border border-[#EAD5C3]/15 transform hover:-translate-y-1 cursor-pointer"
                >
                  YES!!!
                </button>
                <button
                  onClick={() => switchTab("to")}
                  className="px-8 py-3 rounded-full bg-[#1A1A1A] text-[#EAD5C3] font-serif text-sm tracking-widest uppercase underline underline-offset-4 decoration-1 hover:bg-[#2A2A2A] hover:text-white transition-all duration-300 shadow-lg border border-[#EAD5C3]/15 transform hover:-translate-y-1 cursor-pointer"
                >
                  DUHH!!!
                </button>
              </div>
            </div>
          )}

          {/* TO TAB: Full-screen overlay with lace hearts */}
          {activeTab === "to" && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080808] overflow-hidden">

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


          {/* THE TAB: Scattered Photo Gallery */}
          {activeTab === "the" && (
            <div
              className="fixed inset-0 z-50 overflow-y-auto"
              style={{
                background: "radial-gradient(ellipse at 30% 20%, #1A0A0A 0%, #0D0D0D 40%, #080808 100%)",
              }}
            >
              {/* Ambient floating hearts */}
              <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
                {["❤️","💕","🌹","✨","💖","🌸","💗","✦"].map((em, i) => (
                  <span
                    key={i}
                    className="absolute text-lg select-none animate-pulse"
                    style={{
                      left: `${8 + i * 12}%`,
                      top: `${10 + (i % 3) * 28}%`,
                      opacity: 0.08 + (i % 4) * 0.04,
                      fontSize: `${14 + (i % 3) * 8}px`,
                      animation: `float-heart ${4 + i}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.6}s`,
                    }}
                  >
                    {em}
                  </span>
                ))}
              </div>

              {/* Header */}
              <div className="relative z-10 pt-10 pb-4 px-6 text-center animate-fade-in">
                <p className="font-serif text-[#EAD5C3]/50 text-xs tracking-[0.3em] uppercase mb-2">our memories</p>
                <h2
                  className="font-script text-4xl sm:text-5xl md:text-6xl"
                  style={{
                    color: "#EAD5C3",
                    textShadow: "0 2px 20px rgba(234,213,195,0.3)",
                  }}
                >
                  Foto Kita
                </h2>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#EAD5C3]/40" />
                  <span className="text-[#EAD5C3]/40 text-xs">✦</span>
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#EAD5C3]/40" />
                </div>
              </div>

              {/* Photo grid — scattered Polaroid-style */}
              <div className="relative z-10 px-4 sm:px-8 pb-28 pt-4">
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4 space-y-3 sm:space-y-4 max-w-4xl mx-auto">
                  {[
                    { src: "/photos/foto1.jpg", caption: "Moment kita 💕", rotate: "-rotate-2", delay: "0ms", tall: false },
                    { src: "/photos/foto2.jpg", caption: "Selalu happy 🌸", rotate: "rotate-1", delay: "60ms", tall: true },
                    { src: "/photos/foto3.jpg", caption: "Aku sayang kamu ❤️", rotate: "-rotate-1", delay: "120ms", tall: false },
                    { src: "/photos/foto4.jpg", caption: "Kenangan indah ✨", rotate: "rotate-2", delay: "180ms", tall: true },
                    { src: "/photos/foto5.jpg", caption: "Together always 💖", rotate: "-rotate-3", delay: "240ms", tall: false },
                    { src: "/photos/foto6.jpg", caption: "My favourite day 🌹", rotate: "rotate-1", delay: "300ms", tall: true },
                    { src: "/photos/foto7.jpg", caption: "So beautiful 💗", rotate: "rotate-2", delay: "360ms", all: false },
                    { src: "/photos/foto8.jpg", caption: "Kamu segalanya 🌟", rotate: "-rotate-1", delay: "420ms", tall: false },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className={`break-inside-avoid mb-3 sm:mb-4 group ${p.rotate} hover:rotate-0 transition-all duration-500 hover:scale-[1.04] hover:z-20 relative`}
                      style={{
                        animation: `slideUpFade 0.6s ease-out ${p.delay} both`,
                        transformOrigin: "center center",
                      }}
                    >
                      {/* Polaroid frame */}
                      <div
                        className="rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.55)] border border-white/10"
                        style={{
                          background: "linear-gradient(160deg, #FDFBF7 0%, #F0EAE2 100%)",
                          padding: "8px 8px 36px 8px",
                        }}
                      >
                        {/* Photo area */}
                        <div
                          className={`relative w-full overflow-hidden rounded-[2px] bg-[#111111] ${p.tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}
                        >
                          <img
                            src={p.src}
                            alt={p.caption}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              el.style.display = "none";
                            }}
                          />
                          {/* Placeholder when no image */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                            <span className="text-3xl opacity-20 select-none">📷</span>
                            <span className="text-[#EAD5C3]/15 text-[10px] font-sans select-none">foto {i + 1}</span>
                          </div>
                          {/* Subtle gloss overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-[2px]" />
                        </div>
                      </div>

                      {/* Tape decoration on top — alternating */}
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-5 rounded-sm opacity-60 pointer-events-none"
                        style={{
                          background: i % 2 === 0
                            ? "rgba(234,213,195,0.55)"
                            : "rgba(220,180,180,0.45)",
                          transform: `translateX(-50%) rotate(${i % 3 === 0 ? -8 : i % 3 === 1 ? 4 : -2}deg)`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={() => switchTab("to")}
                className="fixed bottom-7 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full border border-[#EAD5C3]/50 text-[#EAD5C3]/80 hover:border-[#EAD5C3] hover:text-[#EAD5C3] hover:bg-[#EAD5C3]/10 transition-all duration-300 cursor-pointer flex items-center gap-2 z-30 animate-slide-up backdrop-blur-sm"
                style={{ animationDelay: "700ms" }}
              >
                <span className="text-xl">←</span>
              </button>
            </div>
          )}
          {/* LOVE TAB: "This song is for you" — YouTube with lace frame */}
          {activeTab === "love" && (
            <div className="fixed inset-0 z-50 overflow-hidden flex" style={{ background: "#0A0A0A" }}>

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
          {/* OF TAB: "About You" — Redesigned Vintage Scrapbook Pinboard */}
          {activeTab === "of" && (

            <div
              onClick={spawnAboutYouHeart}
              className="fixed inset-0 z-50 overflow-y-auto select-none cursor-pointer"
              style={{
                background: "radial-gradient(circle at center, #2C1A1A 0%, #150A0A 100%)",
                backgroundImage: `
                  radial-gradient(circle at 50% 30%, rgba(78, 24, 24, 0.45) 0%, rgba(21, 10, 10, 0.95) 75%),
                  repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 0, 0, 0.15) 1px, rgba(0, 0, 0, 0.15) 2px),
                  repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0, 0, 0, 0.15) 1px, rgba(0, 0, 0, 0.15) 2px)
                `,
                backgroundSize: "auto, 16px 16px, 16px 16px"
              }}
            >
              {/* Interactive Hearts Overlay */}
              <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                {aboutYouHearts.map((heart) => (
                  <span
                    key={heart.id}
                    className="absolute select-none pointer-events-none"
                    style={{
                      left: heart.x,
                      top: heart.y,
                      fontSize: `${heart.size}px`,
                      animation: "float-up-fade 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards",
                    }}
                  >
                    {heart.emoji}
                  </span>
                ))}
              </div>

              {/* Page Container */}
              <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16 gap-8">
                
                {/* Header */}
                <div className="text-center animate-slide-down" style={{ animationDelay: "100ms" }}>
                  <h2
                    className="font-script text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-transparent bg-gradient-to-b from-[#FFF2E6] via-[#EAD5C3] to-[#C89B9B] bg-clip-text filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                  >
                    About You
                  </h2>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#EAD5C3]/40" />
                    <span className="text-[#D4AF37] text-xs font-serif">❦</span>
                    <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#EAD5C3]/40" />
                  </div>
                  <p className="text-[10px] text-[#EAD5C3]/25 mt-2 italic font-serif">
                    (tap anywhere to scatter love petals)
                  </p>
                </div>

                {/* Scrapbook Board Grid Layout */}
                <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-6 px-2">

                  {/* LEFT COLUMN: 4 Letters pinned to board */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 w-full lg:w-[32%] justify-items-center lg:justify-items-end">
                    {[
                      { 
                        title: "Sweet Smile", 
                        text: "Senyummu yang selalu bikin hari-hariku jadi jauh lebih cerah 🌸", 
                        rotate: "rotate-[-2deg]", 
                        bg: "linear-gradient(to bottom, #FAF6EE 0%, #F3E6CE 100%)",
                        border: "rgba(184, 134, 11, 0.35)", 
                        num: "Ⅰ",
                        delay: "200ms"
                      },
                      { 
                        title: "Laugh & Joy", 
                        text: "Caramu ketawa yang bikin aku ikut bahagia tiap saat 😄", 
                        rotate: "rotate-[3deg]", 
                        bg: "linear-gradient(to bottom, #FFF3F5 0%, #F5D6DA 100%)",
                        border: "rgba(192, 138, 147, 0.4)", 
                        num: "Ⅱ",
                        delay: "300ms"
                      },
                      { 
                        title: "Sincere Heart", 
                        text: "Ketulusanmu dalam setiap hal kecil yang kamu lakukan ❤️", 
                        rotate: "rotate-[-1deg]", 
                        bg: "linear-gradient(to bottom, #FAF6EE 0%, #F3E6CE 100%)",
                        border: "rgba(184, 134, 11, 0.35)", 
                        num: "Ⅲ",
                        delay: "400ms"
                      },
                      { 
                        title: "Deep Care", 
                        text: "Cara kamu perhatiin aku padahal kamu sendiri lagi capek 🥺", 
                        rotate: "rotate-[2deg]", 
                        bg: "linear-gradient(to bottom, #EBF3F5 0%, #D0E4E8 100%)",
                        border: "rgba(123, 146, 166, 0.4)", 
                        num: "Ⅳ",
                        delay: "500ms"
                      }
                    ].map((card, i) => (
                      <div
                        key={i}
                        className={`w-full max-w-[270px] aspect-[4/3] relative rounded-md shadow-[0_12px_28px_rgba(0,0,0,0.5)] border border-[#FFF]/10 transition-all duration-500 hover:scale-[1.06] hover:rotate-0 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.65)] hover:z-30 cursor-pointer ${card.rotate} animate-scale-up`}
                        style={{
                          background: card.bg,
                          animationDelay: card.delay,
                        }}
                      >
                        {/* Brass Thumbtack with shadow */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 z-20">
                          {/* Tack shadow */}
                          <div className="absolute top-2.5 left-1 w-2.5 h-1.5 bg-black/45 blur-[0.6px] rounded-full transform rotate-12" />
                          {/* Tack head */}
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD700] via-[#C5A029] to-[#8B7500] border border-[#B8860B]/70 shadow-sm" />
                          {/* Tack center pin shine */}
                          <div className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-white/45" />
                        </div>

                        {/* Card Internal Layout */}
                        <div className="w-full h-full p-4 flex flex-col justify-between" style={{ borderColor: card.border }}>
                          {/* Letterhead */}
                          <div className="flex justify-between items-center border-b border-black/10 pb-1.5">
                            <span className="font-script text-[#7A5B4C] text-[15px] tracking-wide font-semibold">
                              {card.title}
                            </span>
                            <span className="font-serif text-[#7A5B4C]/45 text-[10px] tracking-widest font-bold">
                              {card.num}
                            </span>
                          </div>

                          {/* Message Body */}
                          <div className="flex-1 flex items-center justify-center py-2">
                            <p className="font-serif text-[#1A1A1A]/90 text-xs sm:text-[13px] leading-relaxed text-center italic select-text">
                              "{card.text}"
                            </p>
                          </div>

                          {/* Signature line */}
                          <div className="text-right text-[8px] font-sans tracking-widest text-[#7A5B4C]/40 uppercase font-semibold">
                            with love ❦
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CENTER PHOTO: Ornate Baroque Gold Exhibition Frame */}
                  <div className="shrink-0 flex flex-col items-center gap-5 z-20 my-4 lg:my-0">
                    <div className="relative group">

                      {/* Heavy Gold Exhibition Frame Container */}
                      <div
                        className="relative shadow-[0_30px_75px_rgba(0,0,0,0.85)] border-[8px] double border-gradient transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:rotate-[1deg] group-hover:shadow-[0_35px_90px_rgba(212,175,85,0.18)]"
                        style={{
                          background: "linear-gradient(135deg, #1C0A0A 0%, #0F0505 100%)",
                          padding: "16px 16px 20px 16px",
                          width: "clamp(220px, 46vw, 260px)",
                          borderRadius: "2px",
                        }}
                      >

                        {/* Image Frame */}
                        <div
                          className="relative overflow-hidden bg-[#2A1818] border-2 border-[#1A0A0A] shadow-[inset_0_4px_12px_rgba(0,0,0,0.7)]"
                          style={{ aspectRatio: "3/4", borderRadius: "1px" }}
                        >
                          <img
                            src="/photos/about-you.jpg"
                            alt="About You"
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          {/* Shadows inside */}
                          <div className="absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] pointer-events-none" />
                          
                          {/* Image Placeholder */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                            <span className="text-5xl opacity-20 animate-pulse text-[#EAD5C3]">📷</span>
                          </div>

                          {/* Film Shine Sweep */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none opacity-60 group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                        </div>

                        {/* Bottom Label under photo (Exhibition plaque style) */}
                        <div className="mt-4 border-t border-[#D4AF37]/25 pt-2.5 text-center flex flex-col gap-0.5 select-none">
                          <span className="font-script text-[#EAD5C3] text-lg md:text-xl tracking-wide">
                            my person 💕
                          </span>
                          <span className="font-sans text-[7.5px] text-[#D4AF37] tracking-[0.25em] uppercase font-bold">
                            est. memory
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Small Decorative Hanging Chain loops at the top */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-12 pointer-events-none z-10 select-none">
                      <div className="w-1.5 h-6 border-l border-r border-[#C5A029]/35" />
                      <div className="w-1.5 h-6 border-l border-r border-[#C5A029]/35" />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: 4 Letters pinned to board */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 w-full lg:w-[32%] justify-items-center lg:justify-items-start">
                    {[
                      { 
                        title: "Soft Voice", 
                        text: "Suaramu yang selalu bikin tenang meski apapun terjadi 🎵", 
                        rotate: "rotate-[2deg]", 
                        bg: "linear-gradient(to bottom, #FFF3F5 0%, #F5D6DA 100%)",
                        border: "rgba(192, 138, 147, 0.4)", 
                        num: "Ⅴ",
                        delay: "350ms"
                      },
                      { 
                        title: "Vibrant Energy", 
                        text: "Semangat kamu yang nular ke aku setiap kali kita ngobrol ✨", 
                        rotate: "rotate-[-3deg]", 
                        bg: "linear-gradient(to bottom, #FAF6EE 0%, #F3E6CE 100%)",
                        border: "rgba(184, 134, 11, 0.35)", 
                        num: "Ⅵ",
                        delay: "450ms"
                      },
                      { 
                        title: "Quiet Expressions", 
                        text: "Cara kamu diem tapi ekspresimu ngomong banyak hal 🥰", 
                        rotate: "rotate-[1deg]", 
                        bg: "linear-gradient(to bottom, #FFF3F5 0%, #F5D6DA 100%)",
                        border: "rgba(192, 138, 147, 0.4)", 
                        num: "Ⅶ",
                        delay: "550ms"
                      },
                      { 
                        title: "Perfect You", 
                        text: "Dan hal terfavorit — kamu itu, kamu yang apa adanya 💖", 
                        rotate: "rotate-[-2deg]", 
                        bg: "linear-gradient(to bottom, #FAF6EE 0%, #F3E6CE 100%)",
                        border: "rgba(184, 134, 11, 0.35)", 
                        num: "Ⅷ",
                        delay: "650ms"
                      }
                    ].map((card, i) => (
                      <div
                        key={i}
                        className={`w-full max-w-[270px] aspect-[4/3] relative rounded-md shadow-[0_12px_28px_rgba(0,0,0,0.5)] border border-[#FFF]/10 transition-all duration-500 hover:scale-[1.06] hover:rotate-0 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.65)] hover:z-30 cursor-pointer ${card.rotate} animate-scale-up`}
                        style={{
                          background: card.bg,
                          animationDelay: card.delay,
                        }}
                      >
                        {/* Brass Thumbtack with shadow */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 z-20">
                          {/* Tack shadow */}
                          <div className="absolute top-2.5 left-1 w-2.5 h-1.5 bg-black/45 blur-[0.6px] rounded-full transform rotate-12" />
                          {/* Tack head */}
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD700] via-[#C5A029] to-[#8B7500] border border-[#B8860B]/70 shadow-sm" />
                          {/* Tack center pin shine */}
                          <div className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-white/45" />
                        </div>

                        {/* Card Internal Layout */}
                        <div className="w-full h-full p-4 flex flex-col justify-between" style={{ borderColor: card.border }}>
                          {/* Letterhead */}
                          <div className="flex justify-between items-center border-b border-black/10 pb-1.5">
                            <span className="font-script text-[#7A5B4C] text-[15px] tracking-wide font-semibold">
                              {card.title}
                            </span>
                            <span className="font-serif text-[#7A5B4C]/45 text-[10px] tracking-widest font-bold">
                              {card.num}
                            </span>
                          </div>

                          {/* Message Body */}
                          <div className="flex-1 flex items-center justify-center py-2">
                            <p className="font-serif text-[#1A1A1A]/90 text-xs sm:text-[13px] leading-relaxed text-center italic select-text">
                              "{card.text}"
                            </p>
                          </div>

                          {/* Signature line */}
                          <div className="text-right text-[8px] font-sans tracking-widest text-[#7A5B4C]/40 uppercase font-semibold">
                            with love ❦
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Back Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent spawning a heart
                    switchTab("to");
                  }}
                  className="mt-6 px-8 py-3 rounded-full border border-[#EAD5C3]/40 text-[#EAD5C3]/75 hover:border-[#EAD5C3] hover:text-[#EAD5C3] hover:bg-[#EAD5C3]/15 transition-all duration-300 cursor-pointer flex items-center gap-2 animate-slide-up backdrop-blur-md z-30 shadow-md"
                  style={{ animationDelay: "700ms" }}
                >
                  <span className="text-xl">←</span>
                </button>
              </div>
            </div>
          )}



          {/* MY LIFE TAB: "My life" — Letter and Photo filmstrips */}
          {activeTab === "my-life" && (
            <div className="fixed inset-0 z-50 overflow-hidden flex bg-[#080808]">
              
              {/* Vertical Gingham Plaid Panel on the Left */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[35%] hidden md:block z-10"
                style={{
                  backgroundColor: "#181818",
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
                  <path d="M 450 120 Q 550 180, 520 280 T 580 450" stroke="#080808" strokeWidth="1.5" />
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
                            <circle cx={cx} cy={cy} r="3" fill="#080808" opacity="0.15" />
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
                    <div className="text-[#111111] font-script text-left h-full flex flex-col justify-between pt-1">
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
              </div>


              {/* Home Navigation button at the bottom center */}
              <button
                onClick={() => switchTab("to")}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#F5EDE0] hover:bg-white text-[#111111] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 cursor-pointer z-30 animate-slide-up"
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