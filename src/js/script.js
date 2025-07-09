import CyrillicToTranslit from "cyrillic-to-translit-js";
const cyrillicToTranslit = new CyrillicToTranslit();

// ** DOM elements **
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

// ** Other variables **
const productCollection = {}; // general list containing all list-items added to productList without "formed-list" class

const listCollection = {}; // collection of lists, e.g. { list1: { product-name-milk: element } }
let currentList; // name of the list that is currently shown in productList with "formed-list" class, e.g. list1

const popupTimerIDs = [];

// ** Tips **
// If productList has "formed-list" class then it shows only list-items that are currently in listCollection[currentList] object
// If productList has "formed-list" class then add-button will add list-item only to listCollection[currentList] object

// If productList has no "formed-list" class then it shows only list-items that are currently in productCollection object
// If productList has no "formed-list" class then add-button will add list-item only to productCollection object

// ** Functions **
const addFormedList = () => {
  productList.classList.add("formed-list");
  controlPanel.newBtn.classList.remove("disabled");
  controlPanel.formBtn.classList.add("disabled");
};

const removeFormedList = () => {
  productList.classList.remove("formed-list");
  controlPanel.newBtn.classList.add("disabled");
  controlPanel.formBtn.classList.remove("disabled");
};

const isFormedListActive = () => productList.classList.contains("formed-list");

const addListItemToProductList = (productID, productName) => {
  const listItem = document.createElement("li");
  listItem.dataset.productKey = productID;
  listItem.innerHTML = `
    <span><input id="${productID}" type="checkbox" checked /></span>
    <label for="${productID}">${productName}</label>
    <button>✖</button>
  `;

  listItem.firstElementChild.addEventListener(
    "click",
    clickOnCheckboxInListItem
  );
  listItem.firstElementChild.firstElementChild.addEventListener(
    "change",
    checkFormBtnState
  );
  listItem.lastElementChild.addEventListener(
    "click",
    removeListItemFromProductList
  );

  productList.append(listItem);

  if (isFormedListActive()) {
    listCollection[currentList][productID] = listItem;
  } else {
    productCollection[productID] = listItem;
    checkFormBtnState();
  }
};

const removeListItemFromProductList = (e) => {
  const listItem = e.target.parentElement;

  // If there is no list-item in both collections then we can remove handlers from it
  if (
    !Object.hasOwn(productCollection, listItem.dataset.productKey) &&
    Object.values(listCollection).every(
      (list) => !Object.hasOwn(list, listItem.dataset.productKey)
    )
  ) {
    listItem.firstElementChild.removeEventListener(
      "click",
      clickOnCheckboxInListItem
    );
    listItem.firstElementChild.firstElementChild.removeEventListener(
      "change",
      checkFormBtnState
    );
    listItem.lastElementChild.removeEventListener(
      "click",
      removeListItemFromProductList
    );
  }

  listItem.remove();

  if (isFormedListActive()) {
    delete listCollection[currentList][listItem.dataset.productKey];
  } else {
    delete productCollection[listItem.dataset.productKey];
    checkFormBtnState();
  }
};

const checkFormBtnState = () => {
  if (productList.querySelector("li:has(input:checked)")) {
    controlPanel.formBtn.classList.remove("disabled");
  } else {
    controlPanel.formBtn.classList.add("disabled");
  }
};

const clickOnCheckboxInListItem = (e) => {
  if (e.target !== e.currentTarget) return;
  e.target.firstElementChild.click();
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

const hideModal = () => {
  modal.input.value = "";
  modal.container.hidden = true;
  document.removeEventListener("click", hideModal);
};

// ** Listeners **
productForm.addEventListener("reset", () => productTextInput.focus());

// When we press add-button
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

  if (
    (isFormedListActive() &&
      Object.hasOwn(listCollection[currentList], productID)) ||
    (!isFormedListActive() && Object.hasOwn(productCollection, productID))
  ) {
    showPopup(alertPopupForProductInput, 0);
    return;
  }

  productTextInput.value = "";
  addListItemToProductList(productID, productName);
});

// ----
controlPanel.formBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  modal.container.hidden = false;
  document.addEventListener("click", hideModal);
});

controlPanel.newBtn.addEventListener("click", () => {
  removeFormedList();

  productList.replaceChildren(...Object.values(productCollection));
  checkFormBtnState();
});

// ----
// When we press ok-button in modal
modal.form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (Object.hasOwn(listCollection, modal.input.value)) {
    showPopup(modal.alertPopup, 1);
    return;
  }

  currentList = modal.input.value;
  listCollection[currentList] = {};
  productList.querySelectorAll("li:has(input:checked)").forEach((listItem) => {
    listCollection[currentList][listItem.dataset.productKey] = listItem;
  });

  modal.input.value = "";
  modal.container.hidden = true;
  addFormedList();
});

modal.form.addEventListener("click", (e) => e.stopPropagation());

modal.cancelBtn.addEventListener("click", hideModal);
