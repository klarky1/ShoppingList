import CyrillicToTranslit from "cyrillic-to-translit-js";
const cyrillicToTranslit = new CyrillicToTranslit();

// DOM elements
const productForm = document.getElementById("product-form");
const productTextInput = document.getElementById("product-text-input");
const alertPopupForProductInput = productForm.querySelector(".alert");
const productList = document.getElementById("product-ordered-list");

const modal = {
  container: document.querySelector(".modal-container"),
  form: document.getElementById("modal-form"),
  input: document.getElementById("modal-text-input"),
  cancelBtn: document.getElementById("modal-cancel-button"),
  alertPopup: document.getElementById("modal-form").querySelector(".alert"),
};

const controlPanel = {
  checkBtn: document.getElementById("check-button"),
  sortBtn: document.getElementById("sort-button"),
  formBtn: document.getElementById("form-button"),
  newBtn: document.getElementById("new-button"),
  selectBtn: document.getElementById("select-button"),
};

// Other variables
const productCollection = {};

let currentList;
const listCollection = {};

const popupTimerIDs = [];

// Functions
const removeElementFromProductList = (e) => {
  const listElem = e.target.parentElement;
  if (productList.classList.contains("formed-list")) {
    listCollection[currentList].delete(listElem);
  } else {
    delete productCollection[listElem.dataset.productId];
  }

  if (
    !Object.values(productCollection).includes(listElem) &&
    Object.values(listCollection).every((setItem) => !setItem.has(listElem))
  ) {
    e.target.removeEventListener("click", removeElementFromProductList);
  }

  listElem.remove();
};

const showPopup = (popup, index) => {
  popup.style.visibility = "visible";
  popup.style.opacity = 1;
  clearTimeout(popupTimerIDs[index]);
  popupTimerIDs[index] = setTimeout(() => {
    popup.style.opacity = 0;
    setTimeout(() => {
      popup.style.visibility = "hidden";
    }, 200);
  }, 1800);
};

const hideModal = (e) => {
  modal.input.value = "";
  modal.container.hidden = true;
  document.removeEventListener("click", hideModal);
};

// Listeners
productForm.addEventListener("reset", () => productTextInput.focus());
productForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const productName =
    productTextInput.value.trim()[0].toUpperCase() +
    productTextInput.value.trim().slice(1);
  let productID = productName.toLowerCase().replace(/\s+/g, "-");

  if (/[а-я]/i.test(productID)) {
    productID = cyrillicToTranslit.transform(productID);
  }

  productID = "product-name-" + productID.replace(/[^a-z0-9-]/g, "");

  if (Object.hasOwn(productCollection, productID)) {
    showPopup(alertPopupForProductInput, 0);
    return;
  }

  productTextInput.value = "";

  const productListElement = document.createElement("li");
  productListElement.dataset.productId = productID;
  productListElement.innerHTML = `
    <span><input id="${productID}" type="checkbox" checked /></span>
    <label for="${productID}">${productName}</label>
    <button>✖</button>
  `;
  productListElement.lastElementChild.addEventListener(
    "click",
    removeElementFromProductList
  );
  productList.append(productListElement);
  productCollection[productID] = productListElement;
});

// ----
controlPanel.formBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  modal.container.hidden = false;
  document.addEventListener("click", hideModal);
});
controlPanel.newBtn.addEventListener("click", () => {
  controlPanel.newBtn.classList.add("disabled");
  controlPanel.formBtn.classList.remove("disabled");
  productList.classList.remove("formed-list");
  productList.replaceChildren(...Object.values(productCollection));
});

// ----
modal.form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (Object.hasOwn(listCollection, modal.input.value)) {
    showPopup(modal.alertPopup, 1);
    return;
  }

  currentList = modal.input.value;
  listCollection[modal.input.value] = new Set(
    productList.querySelectorAll("li:has(input:checked)")
  );
  modal.input.value = "";
  modal.container.hidden = true;
  controlPanel.newBtn.classList.remove("disabled");
  controlPanel.formBtn.classList.add("disabled");
  productList.classList.add("formed-list");
});
modal.form.addEventListener("click", (e) => e.stopPropagation());
modal.cancelBtn.addEventListener("click", hideModal);
