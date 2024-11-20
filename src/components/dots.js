import gsap from "gsap";

// Configuración
const dotCount = 10;
const maxSize = 30;
const withScale = true;
const withBlur = true;
const randColour = false;

// Generación y animación de puntos
export const generateDots = () => {
    for (let i = 0; i < dotCount; i++) {
        const el = document.createElement("div");
        el.classList.add("dot");
        document.querySelector("#dot-container").appendChild(el);
    }
    const dots = gsap.utils.toArray(".dot");
    dots.forEach((dot, index) => {
        let _xPos = Math.random() * window.innerWidth;
        let _yPos = Math.random() * window.innerHeight;
        let size = Math.ceil(Math.random() * maxSize);
        if (size < 10) size = 50;
        if (_xPos > size) _xPos = _xPos - size;
        if (_yPos > size) _yPos = _yPos - size;
        gsap.set(dot, {
            width: size,
            height: size,
            x: _xPos,
            y: _yPos,
            backgroundColor: randColour
                ? "#" + Math.floor(Math.random() * 16777215).toString(16)
                : "#6c8c65",
            scale: withScale ? Math.random() + 0.25 : 1,
            filter: withBlur ? "blur(1rem)" : "unset"
        });
    });
    // Animación
    gsap.timeline({ defaults: { ease: "none", repeat: -1 } })
        .to(dots, {
            xPercent: "random(-100, 100)",
            yPercent: "random(-100, 100)",
            scale: "random(.5, 2)",
            opacity: "random(0, .8)",
            ease: "power1.inOut",
            duration: 6,
            repeatRefresh: true,
        })
        .time(Math.random() * 200);
};

generateDots();
