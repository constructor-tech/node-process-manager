const start = document.getElementById('start');
const name = document.getElementById('name');
const out = document.getElementById('out');

start.addEventListener('click', async () => {
  const result = await window.electronAPI.getProcList(name.value);
  if (result.stdout !== 'ERROR') {
    const tableList = result.stdout;
    for (let i = 0; i < tableList.length; i += 1) {
      const tableValues = tableList[i].trim().split(',');
      const row = out.insertRow();
      if (i > 0) {
        row.insertCell(0).innerHTML = '<button type="button" name="kill">Close</button>';
        row.insertCell(1).innerHTML = tableValues.shift().trim();
        row.insertCell(2).innerHTML = tableValues.join(',').trim();
      } else {
        row.innerHTML = '<tr><td></td>';
        for (let j = 0; j < 2; j += 1) {
          row.innerHTML += `<td><b>${tableValues[j].trim()}</td></b>`;
        }
        row.innerHTML += '</tr>';
      }
    }
  } else {
    out.innerText = result.stderr;
  }
});

out.addEventListener('click', async (evt) => {
  const node = evt.target || evt.srcElement;
  if (node.name === 'kill') {
    const result = await window.electronAPI
      .killProcByPID(node.parentElement.parentElement.cells[1].innerText);
    if (result.stdout !== 'ERROR') {
      node.parentElement.parentElement.remove();
    } else {
      alert(result.stderr);
    }
  }
});

const modal = document.getElementById('searchModal');
const searchBtn = document.getElementById('searchButton');
const search = document.getElementById('search');
const searchVal = document.getElementById('searchVal');
const span = document.getElementsByClassName('close')[0];

searchBtn.onclick = () => {
  modal.style.display = 'block';
};
search.onclick = () => {
  // modal.style.display = "none";
  window.find(searchVal.value);
};

span.onclick = () => {
  modal.style.display = 'none';
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};
