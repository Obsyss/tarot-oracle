
const cardsData = [
    { image: "cards/card01.png", message: "No is a full sentence." },
    { image: "cards/card02.png", message: "Ask a cat." },
    { image: "cards/card03.png", message: "Pretend or not pretend? Thats the question." },
    { image: "cards/card04.png", message: "Maybe it’s not that deep." },
    { image: "cards/card05.png", message: "Well the card speaks for itself." },
    { image: "cards/card06.png", message: "Beware of anything red. Like redflags." },
    { image: "cards/card07.png", message: "Enjoy your life. (or become a duck)" },
    { image: "cards/card08.png", message: "Stop waiting for an answer, do it." },
    { image: "cards/card09.png", message: "Oh dear! You should try again!" },
    { image: "cards/card10.png", message: "You’re exactly the star you think you are." },
    { image: "cards/card11.png", message: "Whats the matter ?" },
    { image: "cards/card12.png", message: "Being sad is okay." },
    { image: "cards/card13.png", message: "Open the door and go. [doesnt work if it’s sunny]" },
    { image: "cards/card14.png", message: "No pressure but the universe is watching you." },
    { image: "cards/card15.png", message: "Be a diva! You’re divine!" },
    { image: "cards/card16.png", message: "There’s better be gold at the end of the bloody rainbow." },
    { image: "cards/card17.png", message: "We still choose the bear." },
    { image: "cards/card18.png", message: "If you’re human, this card is not for you." },
    { image: "cards/card19.png", message: "At that point being abducted by aliens can be a solution." },
    { image: "cards/card20.png", message: "You don’t use your free will enough, darling." },
    { image: "cards/card21.png", message: "Listen to music. Except if you’re deaf/d." },
    { image: "cards/card22.png", message: "There’s fun in funeral." },
    { image: "cards/card23.png", message: "Decaying is the new thing. Trust the process." },
    { image: "cards/card24.png", message: "Tu devrais apprendre le français." },
    { image: "cards/card25.png", message: "Cheers!" },
    { image: "cards/card26.png", message: "Turn your ringer off babe." },
    { image: "cards/card27.png", message: "Overthinking leads nowhere." },
    { image: "cards/card28.png", message: "Eat a soup. It heals the soul." },
    { image: "cards/card29.png", message: "[on vacation try again]" },
    { image: "cards/card30.png", message: "Rejection is redirection." },
    { image: "cards/card31.png", message: "Being whimsical isn’t an option, love." },
    { image: "cards/card32.png", message: "Touch the grass. If it stings, it’s probably not grass." }
];

const cardWall = document.getElementById("card-wall");
const instruction = document.getElementById("instruction");
const overlay = document.getElementById("overlay");

let isDrawing = false;
let isRevealed = false;
let isResetting = false;
let lastRandomIndex = null;
let typingTimeout = null;

/* =========================
   CREATE CARDS
========================= */

// 7 faces et 25 dos pour un paquet de 32 cartes
const numberOfFaceUpCards = Math.round(cardsData.length * 0.22);

const shuffledIndices = cardsData.map((_, i) => i);

for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledIndices[i], shuffledIndices[j]] =
        [shuffledIndices[j], shuffledIndices[i]];
}

const visibleFaces = new Set(
    shuffledIndices.slice(0, numberOfFaceUpCards)
);

cardsData.forEach(function(cardData, index) {
    const card = document.createElement("div");
    card.classList.add("card");

    // Positions initiales d'origine
    const x = (Math.random() - 0.5) * 900;
    const y = (Math.random() - 0.5) * 550;
    const rotation = (Math.random() - 0.5) * 35;

    const initialTransform =
        `translate(${x}px, ${y}px) rotate(${rotation}deg)`;

    card.style.transform = initialTransform;
    card.dataset.initialTransform = initialTransform;
    card.dataset.initialX = x;
    card.dataset.initialY = y;
    card.dataset.initialRotation = rotation;

    const initialZIndex =
        Math.floor(Math.random() * cardsData.length) + 1;

    card.style.zIndex = initialZIndex;
    card.dataset.initialZIndex = initialZIndex;

    // Ne pas modifier le positionnement défini par le CSS.
    card.style.overflow = "hidden";

    // Face de la carte : conserve sa place dans la mise en page.
    const cardImage = document.createElement("img");
    cardImage.src = cardData.image;
    cardImage.classList.add("card-front");
    cardImage.alt = "";

    cardImage.style.display = "block";
    cardImage.style.width = "100%";
    cardImage.style.height = "100%";
    cardImage.style.objectFit = "cover";
    cardImage.style.borderRadius = "inherit";

    // Dos de la carte : superposé à la face.
    const cardBack = document.createElement("img");
    cardBack.src = "cards/card-back.png";
    cardBack.classList.add("card-back");
    cardBack.alt = "";

    cardBack.style.position = "absolute";
    cardBack.style.inset = "0";
    cardBack.style.width = "100%";
    cardBack.style.height = "100%";
    cardBack.style.objectFit = "cover";
    cardBack.style.borderRadius = "inherit";
    cardBack.style.zIndex = "2";
    cardBack.style.pointerEvents = "none";

    const showFace = visibleFaces.has(index);

    cardImage.style.visibility = showFace ? "visible" : "hidden";
    cardBack.style.display = showFace ? "none" : "block";

    card.appendChild(cardImage);
    card.appendChild(cardBack);
    cardWall.appendChild(card);
});

const cards = document.querySelectorAll(".card");

/* =========================
   BEZIER
========================= */

function cubicBezier(t, p0, p1, p2, p3) {
    const u = 1 - t;

    return (
        u * u * u * p0 +
        3 * u * u * t * p1 +
        3 * u * t * t * p2 +
        t * t * t * p3
    );
}

/* =========================
   SHUFFLE
========================= */

function shuffleCards() {
    cards.forEach(function(card) {
        const startX = parseFloat(card.dataset.initialX);
        const startY = parseFloat(card.dataset.initialY);
        const startRotation = parseFloat(card.dataset.initialRotation);

        const endX = (Math.random() - 0.5) * 950;
        const endY = (Math.random() - 0.5) * 600;
        const endRotation =
            startRotation + (Math.random() - 0.5) * 100;

        const control1X =
            startX + (Math.random() - 0.5) * 500;
        const control1Y =
            startY + (Math.random() - 0.5) * 500;

        const control2X =
            endX + (Math.random() - 0.5) * 500;
        const control2Y =
            endY + (Math.random() - 0.5) * 500;

        const keyframes = [];
        const numberOfPoints = 24;

        for (let i = 0; i <= numberOfPoints; i++) {
            const t = i / numberOfPoints;

            const x = cubicBezier(
                t, startX, control1X, control2X, endX
            );

            const y = cubicBezier(
                t, startY, control1Y, control2Y, endY
            );

            const rotation =
                startRotation + (endRotation - startRotation) * t;

            keyframes.push({
                transform:
                    `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                offset: t
            });
        }

        card.style.zIndex = Math.floor(Math.random() * 10) + 1;

        card.animate(keyframes, {
            duration: 2200,
            easing: "ease-in-out",
            fill: "forwards"
        });
    });
}

/* =========================
   TYPING EFFECT
========================= */

function typeMessage(element, text) {
    let index = 0;
    element.textContent = "";

    function typeNextCharacter() {
        if (!element.isConnected) return;

        if (index < text.length) {
            element.textContent += text[index];
            index++;

            typingTimeout = setTimeout(typeNextCharacter, 60);
        } else {
            typingTimeout = null;
        }
    }

    typeNextCharacter();
}

/* =========================
   RESET
========================= */

function resetOracle() {
    isResetting = true;

    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }

    const revealCard = document.getElementById("reveal-card");
    const message = document.getElementById("oracle-message");

    if (revealCard) revealCard.remove();
    if (message) message.remove();

    cardWall.classList.remove("dimmed");
    overlay.style.opacity = "0";

    cards.forEach(function(card) {
        card.getAnimations().forEach(function(animation) {
            animation.cancel();
        });

        card.style.transform = card.dataset.initialTransform;
        card.style.zIndex = card.dataset.initialZIndex;
        card.style.opacity = "1";
    });

    setTimeout(function() {
        instruction.style.display = "block";
        isResetting = false;
    }, 1600);
}

/* =========================
   SPACEBAR
========================= */

document.addEventListener("keydown", function(event) {
    if (event.code !== "Space") return;

    event.preventDefault();

    if (isResetting) return;

    if (isRevealed) {
        isRevealed = false;
        resetOracle();
        return;
    }

    if (isDrawing) return;

    isDrawing = true;
    instruction.style.display = "none";

    let randomIndex;

    do {
        randomIndex = Math.floor(Math.random() * cards.length);
    } while (
        randomIndex === lastRandomIndex &&
        cards.length > 1
    );

    lastRandomIndex = randomIndex;

    const selectedCardData = cardsData[randomIndex];

    console.log("Card selected:", randomIndex);
    console.log("Message:", selectedCardData.message);

    shuffleCards();

    setTimeout(function() {
        cardWall.classList.add("dimmed");
        overlay.style.opacity = "1";

        setTimeout(function() {
            const revealCard = document.createElement("div");
            revealCard.id = "reveal-card";

            const revealInner = document.createElement("div");
            revealInner.id = "reveal-card-inner";

            const revealFace = document.createElement("img");
            revealFace.src = selectedCardData.image;
            revealFace.classList.add("reveal-face");

            const revealBack = document.createElement("img");
            revealBack.src = "cards/card-back.png";
            revealBack.classList.add("reveal-back");

            revealInner.appendChild(revealFace);
            revealInner.appendChild(revealBack);
            revealCard.appendChild(revealInner);

            document.getElementById("oracle").appendChild(revealCard);

            setTimeout(function() {
                revealCard.classList.add("flipping");

                setTimeout(function() {
                    const message = document.createElement("div");
                    message.id = "oracle-message";

                    document.getElementById("oracle").appendChild(message);

                    setTimeout(function() {
                        message.style.opacity = "1";
                        typeMessage(message, selectedCardData.message);
                    }, 50);

                    isDrawing = false;
                    isRevealed = true;
                }, 1000);
            }, 500);
        }, 900);
    }, 2200);
});
