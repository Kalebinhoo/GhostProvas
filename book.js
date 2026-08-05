(async()=>{
    if (!window.CONFIG) window.CONFIG = {API_KEY:atob('Z3NrX1hvZjZjWE5aMUZGODdjeXVtUUpBV0dkeWIzRlk1M0FJYU5WdFRveFNiVFhUb0pUV3ExZ2c='),MODEL:'llama-3.3-70b-versatile'};
    const API_KEY = CONFIG.API_KEY;
    const MODEL = CONFIG.MODEL;
    const TIMER_SECONDS = 15;

    const NEW_LOGO = 'https://kalebinhoo.github.io/GhostProvas/ghostfuture_icon.png';
    const NEW_CONTEUDO = 'https://kalebinhoo.github.io/GhostProvas/conteudo_logo.png';
    function replaceLogo() {
        document.querySelectorAll('img').forEach(img => {
            if (img.src === 'https://edusp-static.ip.tv/sala-do-futuro/logo_sala_do_futuro.png') { img.src = NEW_LOGO; img.onerror = function() { this.style.display = 'none'; }; }
            if (img.src === 'https://edusp-static.ip.tv/sala-do-futuro/conteudo_logo.png') { img.src = NEW_CONTEUDO; img.onerror = function() { this.style.display = 'none'; }; }
        });
    }
    replaceLogo();
    new MutationObserver(replaceLogo).observe(document.body, {childList: true, subtree: true});

    function createTimer() {
        const div = document.createElement('div');
        div.id = 'ghostprovas-timer';
        div.style.cssText = 'position:fixed;bottom:10px;right:10px;background:#1a1a2e;color:#0f0;font-family:monospace;font-size:18px;padding:10px 15px;border-radius:8px;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,0.5);border:1px solid #333;';
        div.textContent = '00:00';
        document.body.appendChild(div);
        return div;
    }

    function updateTimer(el, seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    const timerEl = createTimer();
    const totalSeconds = TIMER_SECONDS;

    for (let i = 0; i < totalSeconds; i++) {
        updateTimer(timerEl, totalSeconds - i);
        await wait(1000);
    }

    timerEl.textContent = 'Processando...';
    timerEl.style.color = '#ff0';

    async function sendToAI(text) {
        const urls = [
            'https://api.groq.com/openai/v1/chat/completions',
            'https://corsproxy.io/?https://api.groq.com/openai/v1/chat/completions',
            'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.groq.com/openai/v1/chat/completions')
        ];
        let lastError;
        for (const url of urls) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + API_KEY
                    },
                    body: JSON.stringify({
                        model: MODEL,
                        messages: [{
                            role: 'user',
                            content: text
                        }],
                        temperature: 0.2,
                        max_tokens: 2000
                    })
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error('HTTP ' + response.status + ': ' + errText.substring(0, 200));
                }
                let rawText = await response.text();
                let data;
                try {
                    data = JSON.parse(rawText);
                } catch(_) {
                    throw new Error('Resposta não é JSON: ' + rawText.substring(0, 200));
                }
                if (data.contents) {
                    try { data = JSON.parse(data.contents); } catch(_) {}
                }
                if (data.error) {
                    throw new Error('API: ' + (data.error.message || JSON.stringify(data.error).substring(0, 200)));
                }
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    return data.choices[0].message.content;
                }
                throw new Error('Resposta inesperada: ' + JSON.stringify(data).substring(0, 200));
            } catch (e) {
                lastError = e;
                continue;
            }
        }
        throw lastError;
    }

    function getCurrentQuestion() {
        return document.querySelector('[questao]');
    }

    function getSubQuestions(questionEl) {
        const radioGroups = questionEl.querySelectorAll('.MuiRadioGroup-root, .MuiFormGroup-root, [class*="Group"]');
        const groups = [];

        if (radioGroups.length === 0) {
            const allInputs = questionEl.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            if (allInputs.length > 0) {
                const groupsByName = {};
                allInputs.forEach(input => {
                    const name = input.name || 'default';
                    if (!groupsByName[name]) groupsByName[name] = [];
                    groupsByName[name].push(input);
                });

                Object.keys(groupsByName).forEach(name => {
                    const inputs = groupsByName[name];
                    if (inputs.length === 0) return;

                    const firstVal = inputs[0].value;
                    const inputType = inputs[0].type;

                    if (inputType === 'radio' && (firstVal === 'true' || firstVal === 'false')) {
                        const parentBox = inputs[0].closest('.css-70qvj9') || inputs[0].closest('.MuiBox-root');
                        const textEl = parentBox ? parentBox.querySelector('.ql-editor') : null;
                        const subText = textEl ? textEl.innerText.trim() : '';
                        groups.push({ type: 'cerroerrado', inputs: inputs, text: subText });
                    } else {
                        const options = [];
                        inputs.forEach(input => {
                            const label = input.closest('label');
                            let textEl = null;
                            if (label) {
                                const parent = label.parentElement;
                                if (parent) textEl = parent.querySelector('.ql-editor');
                                if (!textEl) {
                                    const grandparent = parent ? parent.parentElement : null;
                                    if (grandparent) textEl = grandparent.querySelector('.ql-editor');
                                }
                            }
                            const optText = textEl ? textEl.innerText.trim() : (label ? label.textContent.trim() : input.value);
                            options.push({ value: input.value, text: optText, input: input, type: inputType });
                        });
                        groups.push({ type: inputType === 'checkbox' ? 'multipla_multi' : 'multipla', options: options });
                    }
                });
                return groups;
            }
        }

        radioGroups.forEach(group => {
            const inputs = group.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            if (inputs.length === 0) return;

            const firstVal = inputs[0].value;
            const inputType = inputs[0].type;

            if (inputType === 'radio' && (firstVal === 'true' || firstVal === 'false')) {
                const parentBox = group.closest('.css-70qvj9') || group.closest('.MuiBox-root');
                const textEl = parentBox ? parentBox.querySelector('.ql-editor') : null;
                const subText = textEl ? textEl.innerText.trim() : '';
                groups.push({ type: 'cerroerrado', inputs: inputs, text: subText });
            } else {
                const options = [];
                inputs.forEach(input => {
                    const label = input.closest('label');
                    let textEl = null;
                    if (label) {
                        const parent = label.parentElement;
                        if (parent) textEl = parent.querySelector('.ql-editor');
                        if (!textEl) {
                            const grandparent = parent ? parent.parentElement : null;
                            if (grandparent) textEl = grandparent.querySelector('.ql-editor');
                        }
                    }
                    const optText = textEl ? textEl.innerText.trim() : (label ? label.textContent.trim() : input.value);
                    options.push({ value: input.value, text: optText, input: input, type: inputType });
                });
                groups.push({ type: inputType === 'checkbox' ? 'multipla_multi' : 'multipla', options: options });
            }
        });
        return groups;
    }

    function getTextArea(questionEl) {
        return questionEl.querySelector('textarea.MuiInputBase-inputMultiline') || null;
    }

    function letterToIndex(letter) {
        const map = { 'A': '0', 'B': '1', 'C': '2', 'D': '3', 'E': '4' };
        return map[letter.toUpperCase()] || letter;
    }

    function clickInputList(inputs, answer) {
        let alreadyCorrect = false;
        inputs.forEach(input => {
            const isTarget = (answer === 'certo' && input.value === 'true') ||
                             (answer === 'errado' && input.value === 'false');
            if (input.checked && isTarget) alreadyCorrect = true;
        });
        if (alreadyCorrect) return false;

        let clicked = false;
        inputs.forEach(input => {
            const isTarget = (answer === 'certo' && input.value === 'true') ||
                             (answer === 'errado' && input.value === 'false');
            if (isTarget) {
                const clickTarget = input.closest('label') || input.closest('.MuiRadio-root') || input.closest('.MuiCheckbox-root') || input.parentElement;
                if (clickTarget) clickTarget.click();
                clicked = true;
            }
        });
        return clicked;
    }

    function clickCertoErrado(questionEl, subIndex, answer) {
        const radioGroups = questionEl.querySelectorAll('.MuiRadioGroup-root, .MuiFormGroup-root, [class*="Group"]');
        let group = radioGroups[subIndex];

        if (!group) {
            const allInputs = questionEl.querySelectorAll('input[type="radio"]');
            const groupsByName = {};
            allInputs.forEach(input => {
                const name = input.name || 'default';
                if (!groupsByName[name]) groupsByName[name] = [];
                groupsByName[name].push(input);
            });
            const groupNames = Object.keys(groupsByName);
            if (groupNames[subIndex]) return clickInputList(groupsByName[groupNames[subIndex]], answer);
            return false;
        }

        return clickInputList(group.querySelectorAll('input[type="radio"]'), answer);
    }

    function clickMultipla(item, val) {
        const mappedVal = letterToIndex(val);
        const correctOpt = item.options.find(o => o.value === mappedVal || o.value.toUpperCase() === val);
        if (!correctOpt || !correctOpt.input) return false;
        if (correctOpt.input.checked) return false;
        const clickTarget = correctOpt.input.closest('label') || correctOpt.input.closest('.MuiRadio-root') || correctOpt.input.closest('.MuiCheckbox-root') || correctOpt.input.parentElement;
        if (clickTarget) clickTarget.click();
        return true;
    }

    function clickMultiplaMulti(item, vals) {
        let marcadas = 0;
        vals.forEach(val => {
            const correctOpt = item.options.find(o => o.value.toUpperCase() === val.trim().toUpperCase());
            if (correctOpt && correctOpt.input) {
                const clickTarget = correctOpt.input.closest('label') || correctOpt.input.closest('.MuiRadio-root') || correctOpt.input.closest('.MuiCheckbox-root') || correctOpt.input.parentElement;
                if (clickTarget) clickTarget.click();
                marcadas++;
            }
        });
        return marcadas > 0;
    }

    function fillTextArea(textarea, text) {
        if (textarea.value.trim() === text.trim()) return false;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeInputValueSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', {bubbles: true}));
        textarea.dispatchEvent(new Event('change', {bubbles: true}));
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        return true;
    }

    function clickProxima() {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            if (btn.textContent.includes('Proxima') || btn.textContent.includes('Próxima')) {
                if (btn.disabled || btn.classList.contains('Mui-disabled')) return false;
                btn.click();
                return true;
            }
        }
        return false;
    }

    function buildPromptForQuestion(questionEl) {
        const subs = getSubQuestions(questionEl);
        const textArea = getTextArea(questionEl);
        let prompt = '';
        let items = [];

        const hasInputs = subs.some(s => s.type === 'cerroerrado' || s.type === 'multipla' || s.type === 'multipla_multi');
        if (hasInputs) {
            subs.forEach((sub, si) => {
                if (sub.type === 'cerroerrado') {
                    prompt += '- Certo ou Errado: ' + sub.text + '\n';
                    items.push({ type: 'cerroerrado', subIndex: si });
                } else if (sub.type === 'multipla') {
                    prompt += '- Multipla escolha (marque 1): ';
                    const optLabels = [];
                    sub.options.forEach(opt => { optLabels.push(String.fromCharCode(65 + sub.options.indexOf(opt)) + ') ' + opt.text); });
                    prompt += optLabels.join(' | ') + '\n';
                    items.push({ type: 'multipla', options: sub.options });
                } else if (sub.type === 'multipla_multi') {
                    prompt += '- Multipla escolha (marque TODAS as corretas): ';
                    const optLabels = [];
                    sub.options.forEach(opt => { optLabels.push(String.fromCharCode(65 + sub.options.indexOf(opt)) + ') ' + opt.text); });
                    prompt += optLabels.join(' | ') + '\n';
                    items.push({ type: 'multipla_multi', options: sub.options });
                }
            });
        } else if (textArea) {
            const qText = questionEl.querySelector('.css-rcuo3b .ql-editor');
            const questionText = qText ? qText.innerText.trim() : '';
            prompt += '- Texto livre: ' + questionText + '\n';
            items.push({ type: 'texto', textarea: textArea, questionText: questionText });
        }

        const fullPrompt = 'Responda cada questao abaixo.\nPara Certo/Errado: responda apenas Certo ou Errado.\nPara Multipla escolha (marque 1): responda APENAS com a letra da alternativa correta (A, B, C, D, E).\nPara Multipla escolha (marque TODAS as corretas): responda com as letras separadas por virgula (ex: A, C, D).\nPara Texto livre: responda como um aluno burro e desatento escreveria. Use erros de portugues, frases curtas, sem muita profundidade, erros de concordancia, palavras erradas, sem virgulas certas, sem acentos as vezes, como se tivesse copiado do google e mal entendeu o assunto. Nao use vocabulario avancado, escreva de forma simples e burra.\nSepare cada resposta com ---\n\n' + prompt;
        return { fullPrompt, items };
    }

    function applyAnswers(items, aiAnswer) {
        const parts = aiAnswer.split('---');
        let marcadas = 0;
        items.forEach((item, i) => {
            if (!parts[i]) return;
            let resposta = parts[i].trim().replace(/^\d+[\.\-\):]\s*/i, '').trim();
            if (!resposta) return;

            if (item.type === 'cerroerrado') {
                const lowerResposta = resposta.toLowerCase();
                const questionEl = getCurrentQuestion();
                if (lowerResposta.includes('certo')) { if (clickCertoErrado(questionEl, item.subIndex, 'certo')) marcadas++; }
                else if (lowerResposta.includes('errado')) { if (clickCertoErrado(questionEl, item.subIndex, 'errado')) marcadas++; }
            } else if (item.type === 'multipla') {
                const val = resposta.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                if (val.length > 0 && clickMultipla(item, val)) marcadas++;
            } else if (item.type === 'multipla_multi') {
                const vals = resposta.split(/[,;]/).map(v => v.replace(/[^A-Za-z0-9]/g, '').trim()).filter(v => v.length > 0);
                if (vals.length > 0 && clickMultiplaMulti(item, vals)) marcadas++;
            } else if (item.type === 'texto') {
                if (fillTextArea(item.textarea, resposta)) marcadas++;
            }
        });
        return marcadas;
    }

    async function waitQuestionTimer(seconds, questionNum) {
        for (let i = seconds; i > 0; i--) {
            const m = Math.floor(i / 60);
            const s = i % 60;
            timerEl.textContent = 'Q' + questionNum + ' - ' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            timerEl.style.color = '#ff0';
            await wait(1000);
        }
    }

    async function processAllQuestions() {
        let totalMarcadas = 0;
        let questaoNum = 1;

        while (true) {
            const questionEl = getCurrentQuestion();
            if (!questionEl) {
                timerEl.style.color = '#0f0';
                timerEl.textContent = 'Fim! ' + totalMarcadas + ' questoes.';
                setTimeout(() => timerEl.remove(), 5000);
                return;
            }

            const { fullPrompt, items } = buildPromptForQuestion(questionEl);
            if (items.length === 0) {
                if (!clickProxima()) break;
                await wait(1000);
                continue;
            }

            await waitQuestionTimer(TIMER_SECONDS, questaoNum);

            try {
                const aiAnswer = await sendToAI(fullPrompt);
                const marcadas = applyAnswers(items, aiAnswer);
                totalMarcadas += marcadas;
                questaoNum++;
            } catch (e) {
                timerEl.style.color = '#f00';
                timerEl.textContent = 'Erro Q' + questaoNum;
                alert('Erro na questao ' + questaoNum + ': ' + e.message);
            }

            await wait(500);

            if (!clickProxima()) {
                timerEl.style.color = '#0f0';
                timerEl.textContent = 'Fim! ' + totalMarcadas + ' questoes.';
                setTimeout(() => timerEl.remove(), 5000);
                return;
            }

            await wait(1500);
        }
    }

    processAllQuestions();
})();
