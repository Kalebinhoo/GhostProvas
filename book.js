(async()=>{
    const API_KEY = CONFIG.API_KEY;
    const MODEL = CONFIG.MODEL;
    const TIMER_SECONDS = 15;

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
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        const data = await response.json();
        return data.choices[0].message.content;
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

    function parseAnswers(aiAnswer, allItems) {
        const parts = aiAnswer.split('---');
        const answers = [];
        allItems.forEach((item, i) => {
            if (parts[i]) {
                let resposta = parts[i].trim().replace(/^\d+[\.\-\):]\s*/i, '').trim();
                answers.push(resposta);
            } else { answers.push(''); }
        });
        return answers;
    }

    function scrapeAll() {
        const questions = document.querySelectorAll('[questao]');
        let allItems = [], prompt = '', counter = 1;
        questions.forEach((q) => {
            const subs = getSubQuestions(q);
            const textArea = getTextArea(q);
            const hasInputs = subs.some(s => s.type === 'cerroerrado' || s.type === 'multipla' || s.type === 'multipla_multi');
            if (hasInputs) {
                subs.forEach((sub, si) => {
                    if (sub.type === 'cerroerrado') {
                        prompt += counter + '- Certo ou Errado: ' + sub.text + '\n';
                        allItems.push({ type: 'cerroerrado', questionEl: q, subIndex: si });
                    } else if (sub.type === 'multipla') {
                        prompt += counter + '- Multipla escolha (marque 1): ';
                        const optLabels = [];
                        sub.options.forEach(opt => { optLabels.push(String.fromCharCode(65 + sub.options.indexOf(opt)) + ') ' + opt.text); });
                        prompt += optLabels.join(' | ') + '\n';
                        allItems.push({ type: 'multipla', questionEl: q, options: sub.options });
                    } else if (sub.type === 'multipla_multi') {
                        prompt += counter + '- Multipla escolha (marque TODAS as corretas): ';
                        const optLabels = [];
                        sub.options.forEach(opt => { optLabels.push(String.fromCharCode(65 + sub.options.indexOf(opt)) + ') ' + opt.text); });
                        prompt += optLabels.join(' | ') + '\n';
                        allItems.push({ type: 'multipla_multi', questionEl: q, options: sub.options });
                    }
                    counter++;
                });
            } else if (textArea) {
                const qText = textArea.closest('[questao]').querySelector('.css-rcuo3b .ql-editor');
                const questionText = qText ? qText.innerText.trim() : '';
                prompt += counter + '- Texto livre: ' + questionText + '\n';
                allItems.push({ type: 'texto', questionEl: q, textarea: textArea, questionText: questionText });
                counter++;
            }
        });
        const fullPrompt = 'Responda cada questao abaixo.\nPara Certo/Errado: responda apenas Certo ou Errado.\nPara Multipla escolha (marque 1): responda APENAS com a letra da alternativa correta (A, B, C, D, E).\nPara Multipla escolha (marque TODAS as corretas): responda com as letras separadas por virgula (ex: A, C, D).\nPara Texto livre: responda como um aluno burro e desatento escreveria. Use erros de portugues, frases curtas, sem muita profundidade, erros de concordancia, palavras erradas, sem virgulas certas, sem acentos as vezes, como se tivesse copiado do google e mal entendeu o assunto. Nao use vocabulario avancado, escreva de forma simples e burra.\nSepare cada resposta com ---\n\n' + prompt;
        return { fullPrompt, allItems };
    }

    async function main() {
        const { fullPrompt, allItems } = scrapeAll();
        if (allItems.length === 0) { timerEl.remove(); alert('Nenhuma questao encontrada!'); return; }
        try {
            const aiAnswer = await sendToAI(fullPrompt);
            const answers = parseAnswers(aiAnswer, allItems);
            let marcadas = 0;
            allItems.forEach((item, i) => {
                const resposta = answers[i];
                if (!resposta) return;
                if (item.type === 'cerroerrado') {
                    const lowerResposta = resposta.toLowerCase();
                    if (lowerResposta.includes('certo')) { if (clickCertoErrado(item.questionEl, item.subIndex, 'certo')) marcadas++; }
                    else if (lowerResposta.includes('errado')) { if (clickCertoErrado(item.questionEl, item.subIndex, 'errado')) marcadas++; }
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
            timerEl.style.color = '#0f0';
            timerEl.textContent = 'Pronto! ' + marcadas + ' questoes.';
            setTimeout(() => timerEl.remove(), 5000);
        } catch (e) {
            timerEl.style.color = '#f00';
            timerEl.textContent = 'Erro!';
            alert('Erro: ' + e.message);
        }
    }

    main();
})();
