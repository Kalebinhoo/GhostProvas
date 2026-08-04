(async()=>{
    try {
        window.CONFIG = {API_KEY:atob('Z3NrX1hvZjZjWE5aMUZGODdjeXVtUUpBV0dkeWIzRlk1M0FJYU5WdFRveFNiVFhUb0pUV3ExZ2c='),MODEL:'llama-3.3-70b-versatile'};

        const NEW_LOGO = 'https://kalebinhoo.github.io/GhostProvas/ghostfuture_icon.png';

        function replaceLogo() {
            document.querySelectorAll('img').forEach(img => {
                if (img.src.includes('logo_sala_do_futuro') || img.src.includes('edusp-static.ip.tv')) {
                    img.src = NEW_LOGO;
                    img.onerror = function() { this.style.display = 'none'; };
                }
            });
        }

        replaceLogo();
        const observer = new MutationObserver(replaceLogo);
        observer.observe(document.body, { childList: true, subtree: true });

        let e = document.createElement("script");
        e.src = "https://kalebinhoo.github.io/GhostProvas/book.js";
        document.body.appendChild(e);
    } catch(err) {
        alert("Erro: " + err.message);
    }
})();
