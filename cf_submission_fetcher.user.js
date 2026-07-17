// ==UserScript==
// @name         CF Submission Source Fetcher
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Fetch CF submission sources by triggering the native popup
// @author       cthboss001
// @match        https://codeforces.com/contest/*/status*
// @match        https://codeforces.com/contest/*/status/*
// @match        https://codeforces.com/group/*/contest/*/status*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    if (!location.href.includes('/status')) return;

    // ── Styles ───────────────────────────────────────────────────────────────
    GM_addStyle(`
        #cf-fetcher-bar {
            position: fixed;
            bottom: 16px;
            right: 16px;
            z-index: 99999;
            background: #1e1e2e;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            font-family: monospace;
            font-size: 13px;
            color: #cdd6f4;
            flex-wrap: wrap;
            max-width: 560px;
        }
        #cf-fetcher-bar button {
            padding: 6px 14px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 13px;
            font-family: monospace;
            font-weight: bold;
        }
        #cf-fetch-btn  { background: #89b4fa; color: #1e1e2e; }
        #cf-stop-btn   { background: #f38ba8; color: #1e1e2e; display: none; }
        #cf-clear-btn  { background: #585b70; color: #cdd6f4; }
        #cf-selall-btn { background: #a6e3a1; color: #1e1e2e; }
        #cf-fetcher-bar button:disabled { opacity: 0.4; cursor: not-allowed; }

        .cf-row-check {
            width: 16px; height: 16px;
            cursor: pointer;
            accent-color: #89b4fa;
        }

        /* Output modal */
        #cf-modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.82);
            z-index: 999999;
            justify-content: center;
            align-items: flex-start;
            padding: 30px 20px;
            overflow-y: auto;
        }
        #cf-modal-overlay.visible { display: flex; }
        #cf-modal {
            background: #1e1e2e;
            border: 1px solid #555;
            border-radius: 10px;
            width: 100%;
            max-width: 960px;
            padding: 20px;
            color: #cdd6f4;
            font-family: monospace;
        }
        #cf-modal-topbar {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        #cf-modal-title { font-size: 16px; font-weight: bold; color: #89b4fa; flex: 1; }
        #cf-copy-all-btn {
            background: #cba6f7; color: #1e1e2e;
            border: none; border-radius: 5px;
            padding: 6px 16px; cursor: pointer;
            font-weight: bold; font-size: 13px; font-family: monospace;
        }
        #cf-copy-all-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        #cf-modal-close {
            background: #f38ba8; color: #1e1e2e;
            border: none; border-radius: 5px;
            padding: 6px 14px; cursor: pointer;
            font-weight: bold; font-size: 13px; font-family: monospace;
        }
        #cf-all-block { display: none; margin-bottom: 20px; }
        #cf-all-block-label { font-size: 12px; color: #a6adc8; margin-bottom: 6px; }
        #cf-all-textarea {
            width: 100%; height: 280px;
            background: #11111b; color: #cdd6f4;
            border: 1px solid #45475a; border-radius: 6px;
            padding: 12px; font-size: 12px; font-family: monospace;
            line-height: 1.6; resize: vertical; box-sizing: border-box;
        }
        .cf-submission-block {
            margin-bottom: 20px;
            border: 1px solid #313244;
            border-radius: 6px;
            overflow: hidden;
        }
        .cf-sub-header {
            background: #313244; padding: 8px 14px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .cf-sub-header span { font-size: 13px; color: #cba6f7; }
        .cf-copy-one-btn {
            background: #a6e3a1; color: #1e1e2e;
            border: none; border-radius: 4px;
            padding: 4px 12px; cursor: pointer;
            font-weight: bold; font-size: 12px; font-family: monospace;
        }
        .cf-source-code {
            background: #181825; padding: 14px;
            font-size: 12px; line-height: 1.6;
            overflow-x: auto; white-space: pre;
            color: #cdd6f4; max-height: 350px;
            overflow-y: auto; margin: 0;
        }
        .cf-error-msg { color: #f38ba8; padding: 14px; font-size: 13px; }
        #cf-progress { font-size: 12px; color: #a6e3a1; min-width: 160px; }
    `);

    // ── Floating bar ─────────────────────────────────────────────────────────
    const bar = document.createElement('div');
    bar.id = 'cf-fetcher-bar';
    bar.innerHTML = `
        <span>⚡ CF Fetcher</span>
        <button id="cf-selall-btn">☑ Select All</button>
        <button id="cf-fetch-btn">⬇ Fetch Sources</button>
        <button id="cf-stop-btn">⏹ Stop</button>
        <button id="cf-clear-btn">✕ Clear</button>
        <span id="cf-progress"></span>
    `;
    document.body.appendChild(bar);

    // ── Output modal ──────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'cf-modal-overlay';
    overlay.innerHTML = `
        <div id="cf-modal">
            <div id="cf-modal-topbar">
                <div id="cf-modal-title">📋 Submission Sources</div>
                <button id="cf-copy-all-btn" disabled>📄 Copy All</button>
                <button id="cf-modal-close">✕ Close</button>
            </div>
            <div id="cf-all-block">
                <div id="cf-all-block-label">All solutions merged — use Copy All button above</div>
                <textarea id="cf-all-textarea" readonly spellcheck="false"></textarea>
            </div>
            <div id="cf-modal-body"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('cf-modal-close').addEventListener('click', () => overlay.classList.remove('visible'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('visible'); });

    // ── Inject checkboxes ─────────────────────────────────────────────────────
    function injectCheckboxes() {
        const table = document.querySelector('table.status-frame-datatable') ||
                      document.querySelector('.datatable table');
        if (!table) return;

        const headerRow = table.querySelector('tr');
        if (headerRow && !headerRow.querySelector('.cf-check-th')) {
            const th = document.createElement('th');
            th.className = 'cf-check-th';
            th.style.cssText = 'width:30px;text-align:center;';
            headerRow.insertBefore(th, headerRow.firstChild);
        }

        table.querySelectorAll('tr').forEach(row => {
            if (row.querySelector('.cf-check-td')) return;
            const idLink = row.querySelector('td a[href*="/submission/"]');
            if (!idLink) return;
            const submissionId = idLink.href.match(/\/submission\/(\d+)/)?.[1];
            if (!submissionId) return;

            const cells = row.querySelectorAll('td');
            const td = document.createElement('td');
            td.className = 'cf-check-td';
            td.style.cssText = 'text-align:center;vertical-align:middle;';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'cf-row-check';
            cb.dataset.subId = submissionId;
            cb.dataset.who   = cells[2]?.innerText?.trim() || '';
            cb.dataset.prob  = cells[3]?.innerText?.trim() || '';
            cb.dataset.link  = idLink.href; // store the actual link

            td.appendChild(cb);
            row.insertBefore(td, row.firstChild);
        });
    }

    injectCheckboxes();
    new MutationObserver(injectCheckboxes).observe(document.body, { childList: true, subtree: true });

    // ── Select All / Clear ────────────────────────────────────────────────────
    document.getElementById('cf-selall-btn').addEventListener('click', () => {
        const boxes = document.querySelectorAll('.cf-row-check');
        const allOn = [...boxes].every(c => c.checked);
        boxes.forEach(c => c.checked = !allOn);
        document.getElementById('cf-selall-btn').textContent = allOn ? '☑ Select All' : '☐ Deselect All';
    });

    document.getElementById('cf-clear-btn').addEventListener('click', () => {
        document.querySelectorAll('.cf-row-check').forEach(c => c.checked = false);
        document.getElementById('cf-progress').textContent = '';
        document.getElementById('cf-selall-btn').textContent = '☑ Select All';
    });

    // ── Stop flag ─────────────────────────────────────────────────────────────
    let stopRequested = false;
    document.getElementById('cf-stop-btn').addEventListener('click', () => {
        stopRequested = true;
        document.getElementById('cf-progress').textContent = '⏹ Stopping…';
    });

    // ── Copy All ──────────────────────────────────────────────────────────────
    document.getElementById('cf-copy-all-btn').addEventListener('click', function () {
        const ta = document.getElementById('cf-all-textarea');
        if (!ta.value) return;
        navigator.clipboard.writeText(ta.value).then(() => {
            this.textContent = '✓ Copied!';
            setTimeout(() => this.textContent = '📄 Copy All', 2000);
        });
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function countdown(secs, el) {
        for (let i = secs; i > 0; i--) {
            if (stopRequested) break;
            el.textContent = `⏳ Next in ${i}s…`;
            await sleep(1000);
        }
    }

    // ── Close any open CF popup ───────────────────────────────────────────────
    function closeCFPopup() {
        // CF uses Codeforces.showMessage or a custom modal — close button is usually .close or [data-close]
        const closeBtn = document.querySelector('.popup-close') ||
                         document.querySelector('.close[onclick]') ||
                         document.querySelector('a.close') ||
                         document.querySelector('.popup .close');
        if (closeBtn) closeBtn.click();

        // Also try pressing Escape
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    }

    // ── Wait for CF popup to appear and extract source ────────────────────────
    function waitForPopupSource(timeoutMs = 10000) {
        return new Promise((resolve) => {
            const start = Date.now();

            const check = setInterval(() => {
                // CF popup selectors — the source appears in one of these
                const sourceEl =
                    document.querySelector('.popup .source') ||
                    document.querySelector('.popup pre') ||
                    document.querySelector('[id^="program-source"]') ||
                    document.querySelector('.source-popup pre') ||
                    document.querySelector('.verdict-popup pre') ||
                    document.querySelector('.popup-source') ||
                    null;

                if (sourceEl && sourceEl.textContent.trim().length > 10) {
                    clearInterval(check);
                    // innerText preserves newlines from <br> and block elements
                    // textContent loses formatting when CF uses <span> for syntax highlighting
                    let code = sourceEl.innerText || sourceEl.textContent;

                    // Normalize line endings and trim
                    code = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

                    // If still looks single-line (no newlines), try rebuilding from child nodes
                    if (!code.includes('\n')) {
                        let rebuilt = '';
                        sourceEl.childNodes.forEach(node => {
                            if (node.nodeType === Node.TEXT_NODE) {
                                rebuilt += node.textContent;
                            } else if (node.nodeName === 'BR') {
                                rebuilt += '\n';
                            } else if (node.nodeName === 'SPAN' || node.nodeName === 'DIV') {
                                rebuilt += node.innerText || node.textContent;
                            }
                        });
                        if (rebuilt.includes('\n')) code = rebuilt.trim();
                    }

                    resolve(code);
                    return;
                }

                if (Date.now() - start > timeoutMs) {
                    clearInterval(check);
                    resolve(null);
                }
            }, 200);
        });
    }

    // ── Main fetch loop ───────────────────────────────────────────────────────
    document.getElementById('cf-fetch-btn').addEventListener('click', async () => {
        const selected = [...document.querySelectorAll('.cf-row-check:checked')];
        if (selected.length === 0) {
            alert('No submissions selected. Tick the checkboxes first.');
            return;
        }

        const fetchBtn   = document.getElementById('cf-fetch-btn');
        const stopBtn    = document.getElementById('cf-stop-btn');
        const progress   = document.getElementById('cf-progress');
        const modalBody  = document.getElementById('cf-modal-body');
        const allBlock   = document.getElementById('cf-all-block');
        const allTA      = document.getElementById('cf-all-textarea');
        const copyAllBtn = document.getElementById('cf-copy-all-btn');

        stopRequested    = false;
        fetchBtn.disabled = true;
        fetchBtn.style.display = 'none';
        stopBtn.style.display  = 'inline-block';
        copyAllBtn.disabled    = true;
        modalBody.innerHTML    = '';
        allBlock.style.display = 'none';
        allTA.value            = '';
        overlay.classList.add('visible');

        const allParts = [];

        for (let i = 0; i < selected.length; i++) {
            if (stopRequested) {
                progress.textContent = `⏹ Stopped at ${i}/${selected.length}`;
                break;
            }

            const cb    = selected[i];
            const subId = cb.dataset.subId;
            const who   = cb.dataset.who  || '?';
            const prob  = cb.dataset.prob || '?';
            const link  = cb.dataset.link;

            progress.textContent = `Fetching ${i + 1}/${selected.length} — #${subId}`;

            // Close any existing CF popup first
            closeCFPopup();
            await sleep(300);

            // Click the submission ID link — this triggers CF's native popup
            const linkEl = document.querySelector(`a[href*="/submission/${subId}"]`);
            if (linkEl) {
                linkEl.click();
            } else {
                // Fallback: direct navigation won't work here, skip
                allParts.push(`/* ===== #${subId} | ${who} | ${prob} =====\n   ERROR: Link not found on page\n*/\n`);
                continue;
            }

            // Wait for the popup's source to appear
            const code = await waitForPopupSource(8000);

            // Build result block
            const block = document.createElement('div');
            block.className = 'cf-submission-block';

            if (!code) {
                block.innerHTML = `
                    <div class="cf-sub-header">
                        <span>#${subId} — ${who} — ${prob}</span>
                    </div>
                    <div class="cf-error-msg">⚠ Could not extract source. CF popup may not have loaded in time.</div>
                `;
                allParts.push(`/* ===== #${subId} | ${who} | ${prob} =====\n   ERROR: Source not found\n*/\n`);
            } else {
                const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                block.innerHTML = `
                    <div class="cf-sub-header">
                        <span>#${subId} — ${who} — ${prob}</span>
                        <button class="cf-copy-one-btn">📋 Copy This</button>
                    </div>
                    <pre class="cf-source-code">${escaped}</pre>
                `;
                block.querySelector('.cf-copy-one-btn').addEventListener('click', function () {
                    navigator.clipboard.writeText(code).then(() => {
                        this.textContent = '✓ Copied!';
                        setTimeout(() => this.textContent = '📋 Copy This', 1500);
                    });
                });

                allParts.push(
`/* ================================================================
   SUBMISSION #${subId}
   Author  : ${who}
   Problem : ${prob}
================================================================ */

${code}
`
                );
            }

            modalBody.appendChild(block);

            // Close the CF popup before next iteration
            closeCFPopup();
            await sleep(500);

            // 5 second delay between submissions
            if (i < selected.length - 1 && !stopRequested) {
                await countdown(5, progress);
            }
        }

        // Build unified textarea
        if (allParts.length > 0) {
            allTA.value = allParts.join('\n\n' + '='.repeat(64) + '\n\n');
            allBlock.style.display = 'block';
            copyAllBtn.disabled = false;
        }

        if (!stopRequested) progress.textContent = `✅ Done (${selected.length})`;

        fetchBtn.disabled = false;
        fetchBtn.style.display = 'inline-block';
        stopBtn.style.display  = 'none';

        document.getElementById('cf-modal').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

})();
