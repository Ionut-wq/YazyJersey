// Așteptăm ca pagina să se încarce complet
document.addEventListener('DOMContentLoaded', () => {

    // === SISTEM GLOBAL MONEDĂ (MERGE PE TOATE PAGINILE) ===
    const exchangeRates = { RON: 1, EUR: 0.20, USD: 0.22 };
    const currencySymbols = { RON: " RON", EUR: "€", USD: "$" };

    // Formatează prețul pentru Coș
    function formatPrice(basePrice, currency) {
        const rate = exchangeRates[currency] || 1;
        const symbol = currencySymbols[currency] || " RON";
        const newPrice = basePrice * rate;

        if (currency === 'RON') {
            return Math.round(newPrice) + symbol;
        } else {
            return symbol + newPrice.toFixed(2);
        }
    }

    // Schimbă automat toate prețurile de pe site (.dynamic-price)
    function updateAllPrices(selectedCurrency) {
        const rate = exchangeRates[selectedCurrency];
        const symbol = currencySymbols[selectedCurrency];
        
        document.querySelectorAll('.dynamic-price').forEach(el => {
            const basePrice = parseFloat(el.getAttribute('data-price'));
            if (!isNaN(basePrice)) {
                const newPrice = basePrice * rate;
                el.innerText = selectedCurrency === 'RON' ? Math.round(newPrice) + symbol : symbol + newPrice.toFixed(2);
            }
        });
        
        if (typeof updateCartUI === 'function') updateCartUI();
    }

    // 1. Elementele coșului din HTML
    const cartOverlay = document.getElementById('cartOverlay');
    const cartSidebar = document.getElementById('cartSidebar');
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartCount = document.getElementById('cartCount');
    const cartTotalPrice = document.getElementById('cartTotalPrice');

    // 2. Inițializăm coșul din memoria browserului (localStorage)
    let cart = JSON.parse(localStorage.getItem('wc26_cart')) || [];

    // Setăm moneda la încărcarea paginii și ascultăm modificările din meniu
    const currencySwitcher = document.getElementById('currencySwitcher');
    if (currencySwitcher) {
        const savedCurrency = localStorage.getItem('preferredCurrency') || 'RON';
        currencySwitcher.value = savedCurrency;
        updateAllPrices(savedCurrency);

        currencySwitcher.addEventListener('change', function() {
            const newCurrency = this.value;
            localStorage.setItem('preferredCurrency', newCurrency);
            updateAllPrices(newCurrency);
            updateCartUI(); // Actualizăm și coșul când se schimbă moneda
        });
    }

    // === ELEMENTE PENTRU POP-UP CONTACT ===
    const checkoutBtn = document.getElementById('checkoutBtn');
    const contactModal = document.getElementById('contactModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // Când apeși pe Finalizează comanda
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Coșul tău este gol! Adaugă produse înainte de a comanda.');
                return;
            }
            
            // PREGĂTIM DATELE PENTRU EMAIL
            let detaliiCosText = "";
            let totalPlataBase = 0;
            const currentCurrency = localStorage.getItem('preferredCurrency') || 'RON';
            
            cart.forEach((item, index) => {
                const formattedItemPrice = formatPrice(item.pret, currentCurrency);
                detaliiCosText += `${index + 1}. ${item.nume} | Mărime: ${item.marime} | Preț: ${formattedItemPrice}\n`;
                totalPlataBase += item.pret; // adunăm prețul brut
            });

            const formattedTotal = formatPrice(totalPlataBase, currentCurrency);

            // Punem datele în câmpurile ascunse din formular
            document.getElementById('formComandaAscunsa').value = detaliiCosText;
            document.getElementById('formTotalAscuns').value = formattedTotal;

            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('active');
            contactModal.classList.add('show');
        });
    }

    // Închidere pop-up cu "X"
    if (closeModalBtn && contactModal) {
        closeModalBtn.addEventListener('click', () => {
            contactModal.classList.remove('show');
        });
        
        // Închidere pop-up dacă dai click oriunde afară din el
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.classList.remove('show');
            }
        });
    }

    // --- FUNCȚII PENTRU DESCHIDERE/ÎNCHIDERE COȘ ---
    if(openCartBtn) {
        openCartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('active');
            updateCartUI(); // Actualizăm ce se vede în coș când îl deschidem
        });
    }

    if(closeCartBtn && cartOverlay) {
        function inchideCosul() {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('active');
        }
        closeCartBtn.addEventListener('click', inchideCosul);
        cartOverlay.addEventListener('click', inchideCosul);
    }

    // --- FUNCȚIA DE ACTUALIZARE A COȘULUI ---
    function updateCartUI() {
        if (!cartItemsContainer) return; // Protecție în caz că nu există elementul pe pagină
        
        cartItemsContainer.innerHTML = '';
        let totalBase = 0; // Totalul brut în RON
        let count = 0;
        
        // Verificăm ce valută este selectată în acest moment
        const currentCurrency = localStorage.getItem('preferredCurrency') || 'RON';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Coșul tău este gol.</p>';
        } else {
            cart.forEach((item, index) => {
                totalBase += item.pret; 
                count++; 

                // Formatăm prețul pentru produsul afișat
                const displayPrice = formatPrice(item.pret, currentCurrency);

                const div = document.createElement('div');
                div.classList.add('cart-item');
                div.innerHTML = `
                    <img src="${item.poza}" alt="${item.nume}">
                    <div class="cart-item-info">
                        <h4>${item.nume}</h4>
                        <p>Mărime: ${item.marime}</p>
                        <p class="cart-item-price">${displayPrice}</p>
                    </div>
                    <button class="remove-item" onclick="stergeDinCos(${index})">&times;</button>
                `;
                cartItemsContainer.appendChild(div);
            });
        }

        // Actualizăm textele de pe ecran
        if(cartCount) cartCount.innerText = count;
        if(cartTotalPrice) {
            cartTotalPrice.innerText = formatPrice(totalBase, currentCurrency);
        }
    }

    // --- FUNCȚIA DE SALVARE ---
    window.salveazaCosul = function() {
        localStorage.setItem('wc26_cart', JSON.stringify(cart));
        updateCartUI();
    }

    // --- FUNCȚIA DE ȘTERGERE ---
    window.stergeDinCos = function(index) {
        cart.splice(index, 1);
        salveazaCosul();
    }

    // --- FUNCȚIA DE ADĂUGARE ---
    window.adaugaInCos = function() {
        const numeProdus = document.getElementById('prod-titlu').innerText;
        const pretElement = document.getElementById('pret-nou-pagina-produs');
        
        // Citim atributul curat data-price, nu textul de pe ecran!
        const pretNumar = parseFloat(pretElement.getAttribute('data-price')); 
        // Luăm mereu prima poză din lista de miniaturi (care e mereu fața tricoului)
const pozaProdus = document.getElementById('thumb-0').src;
        
        const butonMarimeActiv = document.querySelector('.size-btn.active');
        const marimeAleasa = butonMarimeActiv ? butonMarimeActiv.innerText : 'Neselectată';

        const checkNume = document.getElementById('checkNume') ? document.getElementById('checkNume').checked : false;
        const selectElem = document.getElementById('selectNume');
        const numeJucator = checkNume ? selectElem.value : '';
        const checkBadge = document.getElementById('checkBadge') ? document.getElementById('checkBadge').checked : false;

        if (checkNume && numeJucator === "") {
            alert("Te rugăm să alegi un jucător din listă!");
            return;
        }

        let detaliiExtra = [];
        if(checkNume) detaliiExtra.push(`Nume: ${numeJucator}`);
        if(checkBadge) detaliiExtra.push('Insignă');
        let textExtra = detaliiExtra.length > 0 ? ` (+ ${detaliiExtra.join(', ')})` : '';

        const produsNou = {
            nume: numeProdus + textExtra,
            pret: pretNumar, 
            poza: pozaProdus, 
            marime: marimeAleasa
        };

        cart.push(produsNou);
        salveazaCosul();
        
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('active');
    }

    updateCartUI();

    // === POP-UP CONTACT GENERAL ===
    const openContactBtn = document.getElementById('openContactBtn');
    const generalContactModal = document.getElementById('generalContactModal');
    const closeGeneralModalBtn = document.getElementById('closeGeneralModalBtn');

    if (openContactBtn && generalContactModal) {
        openContactBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            generalContactModal.classList.add('show');
        });
    }

    if (closeGeneralModalBtn && generalContactModal) {
        closeGeneralModalBtn.addEventListener('click', () => {
            generalContactModal.classList.remove('show');
        });
        generalContactModal.addEventListener('click', (e) => {
            if (e.target === generalContactModal) {
                generalContactModal.classList.remove('show');
            }
        });
    }

    // === GOLIRE COȘ DUPĂ TRIMITEREA COMENZII ===
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', () => {
            cart = [];
            salveazaCosul();
        });
    }

    // === SISTEM MENIU HAMBURGER (TELEFON) ===
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    const navLinks = document.querySelectorAll('.nav-links a'); 

    if (hamburgerBtn && mobileNav) {
        // Când apeși pe butonul ☰
        hamburgerBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
        });

        // Când apeși pe oricare link din meniu, închide meniul automat
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
            });
        });
    }
});