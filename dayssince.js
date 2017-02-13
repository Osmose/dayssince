const count = document.querySelector('#count');
const what = document.querySelector('#what');
const reset = document.querySelector('#reset');

let url = new URL(window.location);
let lastOccurred = null;

let whatText = url.searchParams.get('event');
if (whatText) {
    what.textContent = whatText;
    if (!localStorage[whatText]) {
        localStorage[whatText] = new Date();
    }
    lastOccurred = new Date(localStorage[whatText]);
    updateCount();
} else {
    count.textContent = 0;
    what.contentEditable = "true";
    what.addEventListener('keydown', event => {
        if (event.keyCode === 13) {
            event.preventDefault();
            what.contentEditable = "false";
            whatText = what.textContent;
            url = new URL(window.location);
            url.searchParams.set('event', whatText);
            window.location = url.href;
        }
    });
}

reset.addEventListener('click', event => {
    if (whatText) {
        lastOccurred = new Date();
        localStorage[whatText] = lastOccurred;
        updateCount();
    }
});

function updateCount() {
    count.textContent = Math.floor(Math.abs(new Date() - lastOccurred) / (1000 * 60 * 60 * 24));
}
