class Analysis {
    inputFileElement = null;
    searchInputElement = null;
    searchButton = null;
    cardsElement = null;

    importData = [];
    requestsPerMonthInYear = {};
    types = ["коляски", "протезы", "подгузники"];
    searchRequest = '';

    charts = [];

    monthLabels = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    config = {
        type: 'bar',
        data: {
            labels: [],
            datasets: [],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true, 
                }
            }
        },
    };

    CPI = {
        '2022-2023': [111.77, 110.99, 103.51, 102.31, 102.51, 103.25, 103.41, 105.15, 106.00, 106.69, 107.48, 107.42],
        '2023-2024': [107.44, 107.69, 107.72, 107.84, 108.30, 109.13]
    }

    constructor() {
        bsCustomFileInput.init();

        this.inputFileElement = document.getElementById("exampleInputFile");
        this.inputFileElement.addEventListener("change", (event) => {
            console.log(1);
            this.readFile(event);
        });

        this.searchInputElement = document.getElementById("search-input");
        this.searchButton = document.getElementById("search-button");
        this.cardsElement = document.getElementById("cards");
        this.searchButton.addEventListener("click", (event) => {
            this.searchRequest = this.searchInputElement.value.toLowerCase();
            for (let key of Object.keys(this.importData[0])) {
                if (key.toLowerCase().includes('вид тср')) {
                    const filterKey = key;
                    console.log(filterKey);
                    const dataBySearch = this.importData.filter(dataItem => dataItem[filterKey].toLowerCase().includes(this.searchRequest.toLowerCase()));
                    console.log(dataBySearch);
                    this.handleData(dataBySearch);
                }
            }
        });
    }

    readFile(event) {
        const that = this;

        const file = event.target.files[0];

        const reader = new FileReader();
    
        reader.onload = function(e) {
            const data = e.target.result;
            const workbook = XLSX.read(data, {
                type: "binary",
            });
    
            workbook.SheetNames.forEach(function (sheetName) {
                const XL_row_object = XLSX.utils.sheet_to_row_object_array(
                    workbook.Sheets[sheetName]
                );
                that.importData = JSON.parse(JSON.stringify(XL_row_object));
            });
        };
    
        reader.onerror = function (err) {
            console.log(err);
        };
    
        reader.readAsBinaryString(file);

        this.cardsElement.innerHTML = '';
        this.importData = [];
        this.requestsPerMonthInYear = {};
    }
        

    handleData(data) {
        for (const dataItem of data) {
            if (dataItem["Дата направления"] && dataItem["Дата формирования"] && dataItem['Статус направления'] !== 'Аннулировано') {
                const [year, month, day] = dataItem["Дата формирования"].split('-');
                dataItem["requestHandleTime"] = (new Date(dataItem["Дата направления"]) - new Date(dataItem["Дата формирования"])) / (1000 * 60 * 60 * 24);
                dataItem["pricePerUnit"] = +dataItem['Сумма'] / +dataItem['Кол-во по направлению'];
                if (!(this.searchRequest in this.requestsPerMonthInYear)) {
                    this.requestsPerMonthInYear[this.searchRequest] = {};
                }

                if (!(year in this.requestsPerMonthInYear[this.searchRequest])) {
                    this.requestsPerMonthInYear[this.searchRequest][year] = {
                        months: {}
                    };
                }

                if (!('amount' in this.requestsPerMonthInYear[this.searchRequest][year])) {
                    this.requestsPerMonthInYear[this.searchRequest][year]['amount'] = 0;
                }
                this.requestsPerMonthInYear[this.searchRequest][year]['amount']++;

                if (!('timeForRequests' in this.requestsPerMonthInYear[this.searchRequest][year])) {
                    this.requestsPerMonthInYear[this.searchRequest][year]['timeForRequests'] = 0;
                }
                this.requestsPerMonthInYear[this.searchRequest][year]['timeForRequests'] += dataItem["requestHandleTime"];

                if (dataItem['Сумма']) {
                    if (!('sum' in this.requestsPerMonthInYear[this.searchRequest][year])) {
                        this.requestsPerMonthInYear[this.searchRequest][year]['sum'] = 0;
                    }
                    this.requestsPerMonthInYear[this.searchRequest][year]['sum'] += +dataItem['Сумма'];
                }

                if (!(month in this.requestsPerMonthInYear[this.searchRequest][year]['months'])) {
                    this.requestsPerMonthInYear[this.searchRequest][year]['months'][month] = {};
                }

                if (!('amount' in this.requestsPerMonthInYear[this.searchRequest][year]['months'][month])) {
                    this.requestsPerMonthInYear[this.searchRequest][year]['months'][month]['requestAmount'] = 0;
                }
                this.requestsPerMonthInYear[this.searchRequest][year]['months'][month]['requestAmount']++;

                if (dataItem['Сумма']) {
                    if (!('sum' in this.requestsPerMonthInYear[this.searchRequest][year]['months'][month])) {
                        this.requestsPerMonthInYear[this.searchRequest][year]['months'][month]['sum'] = 0;
                    }
                    this.requestsPerMonthInYear[this.searchRequest][year]['months'][month]['sum'] += +dataItem['Сумма'];

                    if (!('amount' in this.requestsPerMonthInYear[this.searchRequest][year]['months'][month])) {
                        this.requestsPerMonthInYear[this.searchRequest][year]['months'][month]['amount'] = 0;
                    }
                    this.requestsPerMonthInYear[this.searchRequest][year]['months'][month]['amount'] += +dataItem['Кол-во по направлению'];
                }
            };
        }

        if (!(this.searchRequest in this.requestsPerMonthInYear)) {
            this.cardsElement.innerHTML = '';
            const notFoundElement = document.createElement('div');
            notFoundElement.classList.add('not-found');
            notFoundElement.innerText = 'По вашему запросу ничего не найдено';
            this.cardsElement.appendChild(notFoundElement);
            return;
        }

        for (let yearData of Object.values(this.requestsPerMonthInYear[this.searchRequest])) {
            yearData.averageHandleTime = Math.ceil(yearData.timeForRequests / yearData.amount);
            for (let monthData of Object.values(yearData['months'])) {
                monthData.averagePrice = Math.ceil(monthData.sum / monthData.amount);
            }
        }
         
        console.log(this.requestsPerMonthInYear);
        console.log(data);

        this.cardsElement.innerHTML = '';
        this.createChartRequestPerMonth();
        this.createChartRequestsPerYear();
        this.createChartAverageSpeedPerYear();
        this.createSumPerYear();
        for (let years of Object.keys(this.CPI)) {
            this.createChartAveragePricePerMonthBtwnYears(years.split('-'));
        }
        this.addNote();
    }
    
    createChartRequestsPerYear() {
        let config = { ...this.config };
        config.data = {
            labels: Object.keys(this.requestsPerMonthInYear[this.searchRequest]),
            datasets: [
                {
                    label: 'Количество заявок в год',
                    data: Object.values(this.requestsPerMonthInYear[this.searchRequest]).map(item => item.amount),
                }
            ],
        };
        console.log(config);
        this.createChartCard(config, 'Количество заявок в год');
    }

    createChartAverageSpeedPerYear() {
        let config = { ...this.config };
        config.data = {
            labels: Object.keys(this.requestsPerMonthInYear[this.searchRequest]),
            datasets: [
                {
                    label: 'Средняя скорость обработки заявок в год',
                    data: Object.values(this.requestsPerMonthInYear[this.searchRequest]).map(item => item.averageHandleTime),
                }
            ],
        };
        console.log(config);
        this.createChartCard(config, 'Средняя скорость обработки заявок в год');
    }

    createSumPerYear() {
        let config = { ...this.config };
        config.data = {
            labels: Object.keys(this.requestsPerMonthInYear[this.searchRequest]),
            datasets: [
                {
                    label: 'Расходы в год',
                    data: Object.values(this.requestsPerMonthInYear[this.searchRequest]).map(item => item.sum),
                }
            ],
        };
        this.createChartCard(config, 'Расходы в год');
    }

    createChartRequestPerMonth() {
        let datasets = [];
        for (let year in this.requestsPerMonthInYear[this.searchRequest]) {
            let dataset = {
                label: year,
                data: Object.entries(this.requestsPerMonthInYear[this.searchRequest][year]['months']).sort().map(([month, value]) => value.requestAmount),
            };
            datasets.push(dataset);
        }
        let config = { ...this.config };
        config.data = {
            labels: this.monthLabels,
            datasets: datasets,
        },
        
        console.log(config);
        this.createChartCard(config, 'Количество заявок в месяц');
    }

    createChartAveragePricePerMonthBtwnYears(compareYears) {
        let datasets = [
            {
                label: compareYears[0],
                type: "bar",
                stack: "Prev",
                data: Object.entries(this.requestsPerMonthInYear[this.searchRequest][compareYears[0]]['months']).sort().map(([month, value]) => Math.round(+value.averagePrice)),
            },
            {
                label: 'Увеличение за счет инфляции',
                type: "bar",
                stack: "Prev",
                data: Object.entries(this.requestsPerMonthInYear[this.searchRequest][compareYears[0]]['months']).sort().map(([month, value], index) => {
                    return Math.round(+value.averagePrice * (this.CPI[compareYears.join('-')][index] - 100) / 100);
                }),
            },
            {
                label: compareYears[1],
                type: "bar",
                stack: "Next",
                data: Object.entries(this.requestsPerMonthInYear[this.searchRequest][compareYears[1]]['months']).sort().map(([month, value]) => Math.round(+value.averagePrice)),
            },
        ];
        
        let config = { ...this.config };
        config.data = {
            labels: this.monthLabels,
            datasets: datasets,
        };
        config.options = {
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true
                }
            }
        }
        
        console.log(config);
        this.createChartCard(config, `Средняя стоимость заявки в месяц. ${compareYears[0]}-${compareYears[1]}`);
    }

    createChartCard(config, title) {
        const wrapperElement = document.createElement('div');
        wrapperElement.classList.add(this.searchRequest, 'col-lg-6');

        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        const cardHeaderElement = document.createElement('div');
        cardHeaderElement.classList.add('card-header', 'border-0');

        const cardTitleElement = document.createElement('h3');
        cardTitleElement.classList.add('card-title');
        cardTitleElement.innerText = title;
        cardHeaderElement.appendChild(cardTitleElement);

        const cardBodyElement = document.createElement('div');
        cardBodyElement.classList.add('card-body');

        const divPositionElement = document.createElement('div');
        divPositionElement.classList.add('position-relative', 'mb-4');

        const canvasElement = document.createElement('canvas');
        canvasElement.width = '1352';
        canvasElement.height = '400';
        canvasElement.style = { 'display': 'block', 'height': '200px', 'width': '676px' };
        canvasElement.classList.add('chartjs-render-monitor');
        divPositionElement.appendChild(canvasElement);
        cardBodyElement.appendChild(divPositionElement);
        cardElement.appendChild(cardHeaderElement);
        cardElement.appendChild(cardBodyElement);
        wrapperElement.appendChild(cardElement);

        this.cardsElement.appendChild(wrapperElement);

        const context = canvasElement.getContext("2d");
        console.log(config);
        new Chart(context, config);
    }
    
    addNote() {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.innerHTML = `Примечания: 1. На всех графиках данные группированы по периодам по дате формирования. 2. Подробнее об <a href="CPI.rtf" download>ИПЦ</a>`;
        this.cardsElement.prepend(noteElement);
    }
}

new Analysis();