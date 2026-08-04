(async()=>{
    try {
        window.CONFIG = {API_KEY:atob('Z3NrX1hvZjZjWE5aMUZGODdjeXVtUUpBV0dkeWIzRlk1M0FJYU5WdFRveFNiVFhUb0pUV3ExZ2c='),MODEL:'llama-3.3-70b-versatile'};
        
        let e = document.createElement("script");
        e.src = "https://kalebinhoo.github.io/GhostProvas/book.js";
        document.body.appendChild(e);
    } catch(err) {
        alert("Erro: " + err.message);
    }
})();