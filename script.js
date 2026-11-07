(() => {
    const progressValue = document.getElementById('progress-value');
    const progressTrack = document.getElementById('progress-track');
    const progressLabel = document.getElementById('progress-label');
    const progressDetail = document.getElementById('progress-detail');
    const connectionStatus = document.getElementById('connection-status');

    let progress = 2;
    let phaseStart = 2;
    let phaseEnd = 10;
    let mapLoadCount = 0;
    let mapLoadIndex = 0;

    const phases = {
        INIT_CORE: { start: 8, end: 27, label: 'Inicializace hry', detail: 'Spouštíme herní systémy…' },
        INIT_BEFORE_MAP_LOADED: { start: 27, end: 42, label: 'Příprava světa', detail: 'Připravujeme herní prostředí…' },
        INIT_AFTER_MAP_LOADED: { start: 42, end: 61, label: 'Načítání mapy', detail: 'Načítáme svět a jeho části…' },
        INIT_SESSION: { start: 78, end: 96, label: 'Dokončování připojení', detail: 'Už jen chvilku…' }
    };

    function updateProgress(value) {
        progress = Math.max(progress, Math.min(98, Math.floor(value)));
        progressValue.textContent = `${progress}%`;
        progressTrack.setAttribute('aria-valuenow', String(progress));
        progressTrack.style.setProperty('--progress', `${progress}%`);
    }

    function updatePhase(phase) {
        if (!phase) return;

        phaseStart = phase.start;
        phaseEnd = phase.end;
        progressLabel.textContent = phase.label;
        progressDetail.textContent = phase.detail;
        connectionStatus.textContent = 'NAČÍTÁNÍ HERNÍHO SVĚTA';
        updateProgress(phase.start);
    }

    function updateFromIndex(data) {
        const count = Number(data.count);
        const index = Number(data.idx);

        if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(index)) return;

        const ratio = Math.max(0, Math.min(1, index / count));
        updateProgress(phaseStart + (phaseEnd - phaseStart) * ratio);
    }

    const handlers = {
        startInitFunctionOrder(data) {
            const phase = phases[data.type];
            if (!phase) return;

            updatePhase(phase);

            const count = Number(data.count);
            const order = Number(data.order);
            if (Number.isFinite(count) && count > 0 && Number.isFinite(order)) {
                updateProgress(phase.start + ((phase.end - phase.start) * (order - 1)) / count);
            }
        },

        initFunctionInvoking(data) {
            updateFromIndex(data);
        },

        startDataFileEntries(data) {
            updatePhase({
                start: 61,
                end: 78,
                label: 'Načítání souborů',
                detail: 'Připravujeme herní data…'
            });
            if (Number(data.count) === 0) updateProgress(78);
        },

        performMapLoadFunction(data) {
            const count = Number(data.count);
            mapLoadCount = Number.isFinite(count) && count > 0 ? count : mapLoadCount;
            mapLoadIndex = Number.isFinite(Number(data.idx)) ? Number(data.idx) : mapLoadIndex + 1;

            updatePhase({
                start: 42,
                end: 78,
                label: 'Načítání mapy',
                detail: 'Načítáme svět a jeho části…'
            });

            if (mapLoadCount > 0) {
                updateProgress(42 + (36 * mapLoadIndex) / mapLoadCount);
            }
        }
    };

    window.addEventListener('message', (event) => {
        const data = event.data || {};

        if (typeof handlers[data.eventName] === 'function') {
            handlers[data.eventName](data);
        }
    });

    updateProgress(progress);
})();
