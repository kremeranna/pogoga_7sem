// Конфигурация API
const WEATHER_API_KEY = '3745f015bbcd693d9dac09cec05cc178';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Базовые данные
const defaultWidgets = [
    {
        id: 'weather_1',
        type: 'weather',
        title: 'Погода в Москве',
        position: 0,
        settings: {
            city: 'Moscow',
            units: 'metric'
        },
        data: null,
        isLoading: false,
        error: null
    },
    {
        id: 'weather_2', 
        type: 'weather',
        title: 'Погода в Лондоне',
        position: 1,
        settings: {
            city: 'London',
            units: 'metric'
        },
        data: null,
        isLoading: false,
        error: null
    }
];

let dashboardWidgets = [];
let availableWidgets = [];
let dragSrcElement = null;

// Переменные для игры
let game = {
    score: 0,
    maxScore: 100,
    time: 30, // Начинаем с 30 секунд
    timer: null,
    isPlaying: false,
    cards: [],
    currentCard: null,
    cardInterval: null
};

// Инициализация приложения
function initApp() {
    loadFromLocalStorage();
    renderDashboard();
    renderAvailableWidgets();
    setupEventListeners();
    initGame();
    
    // Автоматическая загрузка данных при старте
    dashboardWidgets.forEach(widget => {
        if (!widget.data) {
            updateWidget(widget.id);
        }
    });
}

// Загрузка из localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('weatherDashboard');
    if (saved) {
        const data = JSON.parse(saved);
        dashboardWidgets = data.dashboardWidgets || [];
        availableWidgets = data.availableWidgets || [];
    } else {
        dashboardWidgets = [...defaultWidgets];
        availableWidgets = [
            {
                id: 'weather_3',
                type: 'weather',
                title: 'Погода в Нью-Йорке',
                settings: { city: 'New York', units: 'metric' }
            },
            {
                id: 'weather_4',
                type: 'weather', 
                title: 'Погода в Токио',
                settings: { city: 'Tokyo', units: 'metric' }
            },
            {
                id: 'weather_5',
                type: 'weather',
                title: 'Погода в Париже', 
                settings: { city: 'Paris', units: 'metric' }
            }
        ];
    }
}

// Сохранение в localStorage
function saveToLocalStorage() {
    const data = {
        dashboardWidgets,
        availableWidgets,
        version: '2.0'
    };
    localStorage.setItem('weatherDashboard', JSON.stringify(data));
}

// Рендер дашборда
function renderDashboard() {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '';

    const sortedWidgets = [...dashboardWidgets].sort((a, b) => a.position - b.position);

    sortedWidgets.forEach(widget => {
        const widgetElement = createWidgetElement(widget);
        dashboard.appendChild(widgetElement);
    });

    initDragAndDrop();
}

// Создание элемента виджета
function createWidgetElement(widget) {
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'widget';
    widgetDiv.dataset.widgetId = widget.id;
    widgetDiv.draggable = true;

    const temperature = widget.data ? Math.round(widget.data.temperature) : '--';
    const unit = getTemperatureUnit(widget.settings.units);

    widgetDiv.innerHTML = `
        <div class="widget-header">
            <h3 class="widget-title">${widget.title}</h3>
            <div class="widget-controls">
                <button class="icon-btn update-btn" title="Обновить">🔄</button>
                <button class="icon-btn settings-btn" title="Настройки">⚙️</button>
                <button class="icon-btn remove-btn" title="Удалить">❌</button>
            </div>
        </div>
        <div class="widget-content">
            ${widget.isLoading ? `
                <div class="loading">
                    <div class="spinner"></div>
                    <div>Загрузка данных...</div>
                </div>
            ` : widget.error ? `
                <div class="error">
                    <div>⚠️ ${widget.error}</div>
                    <button class="btn btn-outline retry-btn">Повторить</button>
                </div>
            ` : widget.data ? `
                <div class="weather-content">
                    <div class="weather-main">
                        <div class="temperature">${temperature}${unit}</div>
                        <img class="weather-icon" src="https://openweathermap.org/img/wn/${widget.data.icon}@2x.png" alt="${widget.data.description}">
                    </div>
                    <div class="weather-details">
                        <div class="detail-item">💧 Влажность: ${widget.data.humidity}%</div>
                        <div class="detail-item">💨 Ветер: ${widget.data.windSpeed} ${getSpeedUnit(widget.settings.units)}</div>
                        <div class="detail-item">🌡️ Ощущается: ${Math.round(widget.data.feelsLike)}${unit}</div>
                        <div class="detail-item">📊 Давление: ${widget.data.pressure} hPa</div>
                    </div>
                </div>
            ` : '<div>Нет данных</div>'}
        </div>
    `;

    widgetDiv.querySelector('.remove-btn').addEventListener('click', () => removeWidget(widget.id));
    widgetDiv.querySelector('.update-btn').addEventListener('click', () => updateWidget(widget.id));
    widgetDiv.querySelector('.settings-btn').addEventListener('click', () => openSettings(widget.id));
    
    const retryBtn = widgetDiv.querySelector('.retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => updateWidget(widget.id));
    }

    return widgetDiv;
}

// Получение единиц измерения температуры
function getTemperatureUnit(units) {
    switch(units) {
        case 'metric': return '°C';
        case 'imperial': return '°F';
        default: return 'K';
    }
}

// Получение единиц измерения скорости ветра
function getSpeedUnit(units) {
    switch(units) {
        case 'metric': return 'м/с';
        case 'imperial': return 'миль/ч';
        default: return 'м/с';
    }
}

// Рендер доступных виджетов
function renderAvailableWidgets() {
    const container = document.getElementById('availableWidgets');
    container.innerHTML = '';

    availableWidgets.forEach(widget => {
        const widgetElement = document.createElement('div');
        widgetElement.className = 'available-widget';
        widgetElement.innerHTML = `
            <h4>${widget.title}</h4>
            <div>Город: ${widget.settings.city}</div>
            <small>Единицы: ${getTemperatureUnit(widget.settings.units)}</small>
        `;
        widgetElement.addEventListener('click', () => addWidget(widget.id));
        container.appendChild(widgetElement);
    });
}

// Добавление виджета
function addWidget(widgetId) {
    const widgetIndex = availableWidgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return;

    const widget = {...availableWidgets[widgetIndex]};
    widget.position = dashboardWidgets.length;
    widget.data = null;
    widget.isLoading = false;
    widget.error = null;

    dashboardWidgets.push(widget);
    availableWidgets.splice(widgetIndex, 1);

    saveToLocalStorage();
    renderDashboard();
    renderAvailableWidgets();
    
    updateWidget(widget.id);
}

// Удаление виджета
function removeWidget(widgetId) {
    const widgetIndex = dashboardWidgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return;

    const widget = dashboardWidgets[widgetIndex];
    availableWidgets.push({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        settings: {...widget.settings}
    });

    dashboardWidgets.splice(widgetIndex, 1);
    
    dashboardWidgets.forEach((w, index) => {
        w.position = index;
    });

    saveToLocalStorage();
    renderDashboard();
    renderAvailableWidgets();
}

// Обновление данных виджета через API
async function updateWidget(widgetId) {
    const widget = dashboardWidgets.find(w => w.id === widgetId);
    if (!widget) return;

    widget.isLoading = true;
    widget.error = null;
    renderDashboard();

    try {
        const response = await fetch(
            `${WEATHER_API_URL}?q=${encodeURIComponent(widget.settings.city)}&units=${widget.settings.units}&appid=${WEATHER_API_KEY}&lang=ru`
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Город не найден');
            } else if (response.status === 401) {
                throw new Error('Ошибка API ключа');
            } else {
                throw new Error(`Ошибка API: ${response.status}`);
            }
        }

        const data = await response.json();

        widget.data = {
            temperature: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            description: data.weather[0].description,
            icon: data.weather[0].icon
        };

        widget.title = `Погода в ${data.name}`;

    } catch (error) {
        console.error('Ошибка загрузки погоды:', error);
        widget.error = error.message;
    } finally {
        widget.isLoading = false;
        saveToLocalStorage();
        renderDashboard();
    }
}

// Открытие настроек виджета
function openSettings(widgetId) {
    const widget = dashboardWidgets.find(w => w.id === widgetId);
    if (!widget) return;

    document.getElementById('editingWidgetId').value = widgetId;
    document.getElementById('widgetTitle').value = widget.title;
    document.getElementById('widgetCity').value = widget.settings.city;
    document.getElementById('widgetUnits').value = widget.settings.units;

    document.getElementById('settingsModal').classList.add('show');
}

// Сохранение настроек виджета
function saveWidgetSettings(widgetId, settings) {
    const widget = dashboardWidgets.find(w => w.id === widgetId);
    if (!widget) return;

    widget.title = settings.title;
    widget.settings.city = settings.city;
    widget.settings.units = settings.units;

    saveToLocalStorage();
    renderDashboard();
    renderAvailableWidgets();
    
    updateWidget(widgetId);
}

// Создание нового виджета
function createNewWidget() {
    const newId = 'weather_' + Date.now();
    const newWidget = {
        id: newId,
        type: 'weather',
        title: 'Новый виджет',
        settings: {
            city: 'Moscow',
            units: 'metric'
        }
    };

    availableWidgets.push(newWidget);
    saveToLocalStorage();
    renderAvailableWidgets();
    openSettings(newId);
}

// Инициализация Drag & Drop
function initDragAndDrop() {
    const widgets = document.querySelectorAll('.widget');
    
    widgets.forEach(widget => {
        widget.addEventListener('dragstart', handleDragStart);
        widget.addEventListener('dragend', handleDragEnd);
        widget.addEventListener('dragover', handleDragOver);
        widget.addEventListener('dragenter', handleDragEnter);
        widget.addEventListener('dragleave', handleDragLeave);
        widget.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    dragSrcElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd() {
    document.querySelectorAll('.widget').forEach(w => {
        w.classList.remove('dragging', 'drop-zone');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDragEnter() {
    this.classList.add('drop-zone');
}

function handleDragLeave() {
    this.classList.remove('drop-zone');
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    if (dragSrcElement !== this) {
        const sourceId = dragSrcElement.dataset.widgetId;
        const targetId = this.dataset.widgetId;

        const sourceIndex = dashboardWidgets.findIndex(w => w.id === sourceId);
        const targetIndex = dashboardWidgets.findIndex(w => w.id === targetId);

        [dashboardWidgets[sourceIndex].position, dashboardWidgets[targetIndex].position] = 
        [dashboardWidgets[targetIndex].position, dashboardWidgets[sourceIndex].position];

        saveToLocalStorage();
        renderDashboard();
    }

    return false;
}

// Инициализация игры
function initGame() {
    createGameGrid();
}

// Создание игровой сетки
function createGameGrid() {
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const card = document.createElement('div');
        card.className = 'game-card hidden';
        card.dataset.index = i;
        card.innerHTML = '?';
        card.addEventListener('click', () => handleCardClick(i));
        gameGrid.appendChild(card);
    }
    
    game.cards = Array(9).fill(null);
}

// Обработка клика по карточке
function handleCardClick(index) {
    if (!game.isPlaying || !game.currentCard || game.currentCard.index !== index) {
        return;
    }
    
    const card = document.querySelector(`.game-card[data-index="${index}"]`);
    
    if (game.currentCard.type === 'sun') {
        // Солнышко - +10 очков
        game.score += 10;
        card.classList.add('sun');
        card.innerHTML = '☀️';
    } else {
        // Тучка - -5 очков
        game.score -= 5;
        if (game.score < 0) game.score = 0;
        card.classList.add('cloud');
        card.innerHTML = '☁️';
    }
    
    updateGameUI();
    
    // Проверка победы
    if (game.score >= game.maxScore) {
        endGame(true); // true - победа
    }
}

// Обновление игрового интерфейса
function updateGameUI() {
    document.getElementById('score').textContent = game.score;
    
    // Обновление прогресс-бара
    const progress = (game.score / game.maxScore) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

// Обновление таймера
function updateTimer() {
    game.time--;
    const minutes = Math.floor(game.time / 60).toString().padStart(2, '0');
    const seconds = (game.time % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    
    // Проверка окончания времени
    if (game.time <= 0) {
        endGame(false); // false - проигрыш по времени
    }
}

// Скрытие текущей карточки
function hideCurrentCard() {
    if (!game.isPlaying || !game.currentCard) return;
    
    const card = document.querySelector(`.game-card[data-index="${game.currentCard.index}"]`);
    if (card) {
        card.classList.remove('sun', 'cloud');
        card.classList.add('hidden');
        card.innerHTML = '?';
    }
    game.currentCard = null;
}

// Открытие случайной карточки
function openRandomCard() {
    if (!game.isPlaying) return;
    
    // Скрываем предыдущую карточку
    if (game.currentCard) {
        hideCurrentCard();
    }
    
    // Выбираем случайную карточку
    const randomIndex = Math.floor(Math.random() * 9);
    
    // Определяем тип карточки (70% солнышко, 30% тучка)
    const isSun = Math.random() < 0.7;
    const type = isSun ? 'sun' : 'cloud';
    const emoji = isSun ? '☀️' : '☁️';
    
    // Открываем карточку
    const card = document.querySelector(`.game-card[data-index="${randomIndex}"]`);
    card.classList.remove('hidden');
    card.classList.add(type);
    card.innerHTML = emoji;
    
    game.currentCard = { index: randomIndex, type: type };
}

// Начало игры
function startGame() {
    if (game.isPlaying) {
        resetGame();
        return;
    }
    
    game.isPlaying = true;
    game.score = 0;
    game.time = 30; // Сбрасываем время на 30 секунд
    
    document.getElementById('startGame').textContent = 'Перезапуск';
    updateGameUI();
    updateTimer(); // Обновляем отображение таймера
    
    // Запускаем таймер (обратный отсчет)
    game.timer = setInterval(updateTimer, 1000);
    
    // Запускаем открытие карточек (каждую секунду скрываем старую и открываем новую)
    game.cardInterval = setInterval(() => {
        hideCurrentCard();
        openRandomCard();
    }, 600);
    
    // Первое открытие через 0.6 секунды
    setTimeout(openRandomCard, 600);
}

// Сброс игры
function resetGame() {
    if (game.currentCard) {
        hideCurrentCard();
    }
    
    clearInterval(game.timer);
    clearInterval(game.cardInterval);
    game.isPlaying = false;
    game.score = 0;
    game.time = 30;
    game.currentCard = null;
    
    createGameGrid();
    updateGameUI();
    document.getElementById('timer').textContent = '00:30';
    document.getElementById('startGame').textContent = 'Начать игру';
}

// Конец игры
function endGame(isWin) {
    if (game.currentCard) {
        hideCurrentCard();
    }
    
    game.isPlaying = false;
    clearInterval(game.timer);
    clearInterval(game.cardInterval);
    
    // Показываем модальное окно с результатами
    const timeSpent = 30 - game.time; // Сколько времени прошло
    const minutes = Math.floor(timeSpent / 60).toString().padStart(2, '0');
    const seconds = (timeSpent % 60).toString().padStart(2, '0');
    
    if (isWin) {
        // Победа
        document.getElementById('resultsModal').querySelector('.modal-title').textContent = '🎉 Поздравляем!';
        document.getElementById('resultsModal').querySelector('.result-icon').textContent = '🏆';
        document.getElementById('resultsModal').querySelector('.result-stats p').textContent = 'Вы набрали 100 очков за:';
    } else {
        // Проигрыш по времени
        document.getElementById('resultsModal').querySelector('.modal-title').textContent = '⏰ Время вышло!';
        document.getElementById('resultsModal').querySelector('.result-icon').textContent = '☁️';
        document.getElementById('resultsModal').querySelector('.result-stats p').textContent = `Вы набрали ${game.score} очков за:`;
    }
    
    document.getElementById('finalTime').textContent = `${minutes}:${seconds}`;
    document.getElementById('resultsModal').classList.add('show');
}

// Играть снова
function playAgain() {
    document.getElementById('resultsModal').classList.remove('show');
    resetGame();
    startGame();
}

// Экспорт конфигурации
function exportConfiguration() {
    const config = {
        dashboardWidgets,
        availableWidgets,
        version: '2.0',
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `weather-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Импорт конфигурации
function importConfiguration(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            if (config.dashboardWidgets && config.availableWidgets) {
                if (confirm('Это заменит текущую конфигурацию. Продолжить?')) {
                    dashboardWidgets = config.dashboardWidgets;
                    availableWidgets = config.availableWidgets;
                    
                    saveToLocalStorage();
                    renderDashboard();
                    renderAvailableWidgets();
                    
                    dashboardWidgets.forEach(widget => {
                        updateWidget(widget.id);
                    });
                    
                    alert('Конфигурация успешно импортирована!');
                }
            } else {
                throw new Error('Неверный формат файла');
            }
        } catch (error) {
            alert('Ошибка при импорте: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('toggleWidgetsBtn').addEventListener('click', () => {
        document.getElementById('widgetsPanel').classList.toggle('show');
    });

    document.getElementById('addWidgetBtn').addEventListener('click', () => {
        document.getElementById('widgetsPanel').classList.add('show');
    });

    document.getElementById('showGameBtn').addEventListener('click', () => {
        document.getElementById('gameModal').classList.add('show');
    });

    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const widgetId = document.getElementById('editingWidgetId').value;
        const settings = {
            title: document.getElementById('widgetTitle').value,
            city: document.getElementById('widgetCity').value,
            units: document.getElementById('widgetUnits').value
        };

        saveWidgetSettings(widgetId, settings);
        document.getElementById('settingsModal').classList.remove('show');
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('show');
    });

    document.getElementById('closeGame').addEventListener('click', () => {
        document.getElementById('gameModal').classList.remove('show');
        if (game.isPlaying) {
            resetGame();
        }
    });

    document.getElementById('closeResults').addEventListener('click', () => {
        document.getElementById('resultsModal').classList.remove('show');
    });

    document.getElementById('closeAfterWin').addEventListener('click', () => {
        document.getElementById('resultsModal').classList.remove('show');
        document.getElementById('gameModal').classList.remove('show');
        resetGame();
    });

    document.getElementById('cancelSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('show');
    });

    document.getElementById('exportBtn').addEventListener('click', exportConfiguration);
    
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importConfiguration(e.target.files[0]);
            e.target.value = '';
        }
    });

    document.getElementById('createWidgetBtn').addEventListener('click', createNewWidget);

    document.getElementById('startGame').addEventListener('click', startGame);

    document.getElementById('playAgain').addEventListener('click', playAgain);

    // Закрытие модальных окон по клику вне контента
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            if (e.target.id === 'gameModal' && game.isPlaying) {
                resetGame();
            }
        }
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);