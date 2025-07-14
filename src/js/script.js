import CyrillicToTranslit from "cyrillic-to-translit-js";
const cyrillicToTranslit = new CyrillicToTranslit();

// ** DOM-elements **
const product = {
  form: document.getElementById("product-form"),
  textInput: document.getElementById("product-text-input"),
  alertPopup: document.getElementById("product-form").querySelector(".alert"),
  list: document.getElementById("product-ordered-list"),
};

const modal = {
  container: document.querySelector(".modal-container"),
  form: document.getElementById("modal-form"),
  textInput: document.getElementById("modal-text-input"),
  cancelBtn: document.getElementById("modal-cancel-button"),
  alertPopup: document.getElementById("modal-form").querySelector(".alert"),
};

const control = {
  checkbox: document.getElementById("check-all-checkbox"),
  checkBtn: document.getElementById("check-button"),
  sortBtn: document.getElementById("sort-button"),
  sortInfoPopup: document
    .getElementById("sort-button")
    .querySelector(".sort-type-info"),
  formBtn: document.getElementById("form-button"),
  newBtn: document.getElementById("new-button"),
  selectBtn: document.getElementById("select-button"),
  selectList: document.getElementById("select-unordered-list"),
};

// ** Variables **
const productCollection = {}; // general collection containing all list-items added to product.list without "formed-list" class

const listCollection = {}; // collection of lists, e.g. { list1: { product-name-milk: element } }
let currentListName = null; // name of the list that is currently shown in product.list with "formed-list" class, e.g. list1

const selectCollection = []; // array-collection of list-items added to control.selectList where each represents a corresponding list from listCollection

const popupTimerIDs = [];

let sortIndex = 2;

// ** How it works **
// If product.list has "formed-list" class then add-button will add list-item only to listCollection[currentListName] object
// If product.list has "formed-list" class then it shows only list-items that are currently in listCollection[currentListName] object

// If product.list has no "formed-list" class then add-button will add list-item only to productCollection object
// If product.list has no "formed-list" class then it shows only list-items that are currently in productCollection object

// ** Common Functions **
const isFormedListActive = () => product.list.classList.contains("formed-list");

const showPopup = (popup, index, duration = 1800, fading = 200) => {
  popup.style.visibility = "visible";
  popup.style.opacity = 1;
  clearTimeout(popupTimerIDs[index]);
  popupTimerIDs[index] = setTimeout(() => {
    popup.style.opacity = 0;
    setTimeout(() => {
      popup.style.visibility = "hidden";
    }, fading);
  }, duration);
};

const updateFormBtn = () => {
  if (product.list.querySelector("li:has(input:checked)")) {
    control.formBtn.classList.remove("disabled");
  } else {
    control.formBtn.classList.add("disabled");
  }
};

// ** Functions for add-button **
const addProductToCurrentListCollection = (productID, productName) => {
  const listItem = document.createElement("li");
  listItem.dataset.productKey = productID;
  listItem.dataset.productName = productName;
  listItem.dataset.defaultIndex = Object.keys(
    listCollection[currentListName]
  ).length;
  listItem.dataset.currentIndex = listItem.dataset.defaultIndex;
  listItem.innerHTML = `
    <label>${productName}</label>
    <button>✖</button>
  `;

  listItem.lastElementChild.addEventListener(
    "click",
    removeProductFromProductList
  );

  listCollection[currentListName][productID] = listItem;
};

const addProductToProductCollection = (productID, productName) => {
  const listItem = document.createElement("li");
  listItem.dataset.productKey = productID;
  listItem.dataset.productName = productName;
  listItem.dataset.defaultIndex = Object.keys(productCollection).length;
  listItem.dataset.currentIndex = listItem.dataset.defaultIndex;
  listItem.innerHTML = `
    <span><input id="${productID}" type="checkbox" checked /></span>
    <label for="${productID}">${productName}</label>
    <button>✖</button>
  `;

  listItem.firstElementChild.addEventListener("click", clickOnProductCheckbox);
  listItem.firstElementChild.firstElementChild.addEventListener(
    "change",
    updateFormBtn
  );
  listItem.lastElementChild.addEventListener(
    "click",
    removeProductFromProductList
  );

  productCollection[productID] = listItem;
};

const showProductFromCurrentListCollection = (productID) => {
  product.list.append(listCollection[currentListName][productID]);

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  }
};

const showProductFromProductCollection = (productID) => {
  product.list.append(productCollection[productID]);
  control.checkBtn.classList.remove("disabled");
  updateFormBtn();

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  }
};

// ** Functions for product (list-item) in product.list **
const clickOnProductCheckbox = (e) => {
  if (e.target !== e.currentTarget) return;
  e.target.firstElementChild.click();
};

const removeProductFromProductList = (e) => {
  const listItem = e.target.parentElement;

  if (isFormedListActive()) {
    deleteProductFromCurrentListCollection(listItem);
  } else {
    deleteProductFromProductCollection(listItem);
    updateFormBtn();

    if (product.list.children.length === 0) {
      control.checkBtn.classList.add("disabled");
    }
  }

  listItem.remove();

  if (product.list.children.length < 2) {
    control.sortBtn.classList.add("disabled");
  }
};

const deleteProductFromCurrentListCollection = (listItem) => {
  listItem.lastElementChild.removeEventListener(
    "click",
    removeProductFromProductList
  );

  delete listCollection[currentListName][listItem.dataset.productKey];
};

const deleteProductFromProductCollection = (listItem) => {
  listItem.firstElementChild.removeEventListener(
    "click",
    clickOnProductCheckbox
  );
  listItem.firstElementChild.firstElementChild.removeEventListener(
    "change",
    updateFormBtn
  );
  listItem.lastElementChild.removeEventListener(
    "click",
    removeProductFromProductList
  );

  delete productCollection[listItem.dataset.productKey];
};

// ** Functions for new-button **
const showProductCollection = () => {
  product.list.classList.remove("formed-list");
  control.newBtn.classList.add("disabled");
  product.list.replaceChildren(
    ...Object.values(productCollection).sort(
      (a, b) => a.dataset.currentIndex - b.dataset.currentIndex
    )
  );
  updateFormBtn();
  currentListName = null;

  if (product.list.children.length !== 0) {
    control.checkBtn.classList.remove("disabled");
  }

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  } else {
    control.sortBtn.classList.add("disabled");
  }

  selectCollection.forEach((listItem) => {
    listItem.classList.remove("selected-list");
  });
};

// ** Functions for form-button **
const hideModal = () => {
  modal.textInput.value = "";
  modal.container.hidden = true;
  document.removeEventListener("click", hideModal);
};

// ** Functions for modal **
const addCurrentListToSelectCollection = () => {
  const listItem = document.createElement("li");
  listItem.dataset.listKey = currentListName;
  listItem.innerHTML = `
    <span>${currentListName}</span>
    <button>✖</button>
  `;

  listItem.addEventListener("click", makeSelectedListCurrent);
  listItem.lastElementChild.addEventListener(
    "click",
    removeListFromSelectListAndCollection
  );

  selectCollection.push(listItem);
  control.selectBtn.classList.remove("disabled");

  selectCollection.forEach((listItem) => {
    listItem.classList.remove("selected-list");
  });
  listItem.classList.add("selected-list");
};

const showCurrentListCollection = () => {
  product.list.classList.add("formed-list");
  control.checkBtn.classList.add("disabled");
  control.newBtn.classList.remove("disabled");
  control.formBtn.classList.add("disabled");
  product.list.replaceChildren(
    ...Object.values(listCollection[currentListName]).sort(
      (a, b) => a.dataset.currentIndex - b.dataset.currentIndex
    )
  );

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  } else {
    control.sortBtn.classList.add("disabled");
  }
};

// ** Functions for select-button **
const toggleSelectList = () => {
  control.selectList.hidden = !control.selectList.hidden;

  if (control.selectList.hidden) {
    document.removeEventListener("click", toggleSelectList);
  }
};

// ** Functions for list (list-item) in control.selectList **
const makeSelectedListCurrent = (e) => {
  const listItem = e.target.closest("li");
  currentListName = listItem.dataset.listKey;

  showCurrentListCollection();

  selectCollection.forEach((listItem) => {
    listItem.classList.remove("selected-list");
  });
  listItem.classList.add("selected-list");
};

const removeListFromSelectListAndCollection = (e) => {
  const listItem = e.target.parentElement;

  if (listItem.dataset.listKey === currentListName) {
    showProductCollection();
  }

  listItem.removeEventListener("click", makeSelectedListCurrent);
  e.target.removeEventListener("click", removeListFromSelectListAndCollection);

  selectCollection.splice(selectCollection.indexOf(listItem), 1);
  deleteListFromListCollection(listItem.dataset.listKey);

  listItem.remove();

  if (selectCollection.length) e.stopPropagation();
  else control.selectBtn.classList.add("disabled");
};

const deleteListFromListCollection = (listName) => {
  Object.values(listCollection[listName]).forEach((listItem) => {
    listItem.lastElementChild.removeEventListener(
      "click",
      removeProductFromProductList
    );
  });

  delete listCollection[listName];
};

// ** Listeners **
// Pressing x-button in product.textInput
product.form.addEventListener("reset", () => product.textInput.focus());

// Pressing add-button
product.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const productName =
    product.textInput.value.trim()[0].toUpperCase() +
    product.textInput.value.trim().slice(1);
  let productID = productName.toLowerCase().replace(/\s+/g, "-");

  if (/[а-я]/i.test(productID)) {
    productID = cyrillicToTranslit.transform(productID);
  }

  productID = "product-name-" + productID.replace(/[^a-z0-9-]/g, "");

  if (isFormedListActive()) {
    if (Object.hasOwn(listCollection[currentListName], productID)) {
      showPopup(product.alertPopup, 0);
      return;
    }

    addProductToCurrentListCollection(productID, productName);
    showProductFromCurrentListCollection(productID);
  } else {
    if (Object.hasOwn(productCollection, productID)) {
      showPopup(product.alertPopup, 0);
      return;
    }

    addProductToProductCollection(productID, productName);
    showProductFromProductCollection(productID);
  }

  product.textInput.value = "";
});

// Pressing check-button in control-panel
control.checkBtn.addEventListener("click", (e) => {
  if (e.target !== e.currentTarget) return;
  control.checkbox.click();
});

// Changing checkbox in control-panel
control.checkbox.addEventListener("change", (e) => {
  if (control.checkbox.checked) {
    product.list
      .querySelectorAll('input[type="checkbox"]')
      .forEach((elem) => (elem.checked = true));
  } else {
    product.list
      .querySelectorAll('input[type="checkbox"]')
      .forEach((elem) => (elem.checked = false));
  }
});

// Pressing sort-button
control.sortBtn.addEventListener("click", () => {
  sortIndex++;
  if (sortIndex > 2) sortIndex = 0;
  let sortedArray;

  switch (sortIndex) {
    case 0: // A-Z
      sortedArray = Array.from(product.list.children).sort((a, b) =>
        a.dataset.productName.localeCompare(b.dataset.productName)
      );
      control.sortInfoPopup.textContent = "A-Z";
      break;
    case 1: // Z-A
      sortedArray = Array.from(product.list.children).sort((a, b) =>
        b.dataset.productName.localeCompare(a.dataset.productName)
      );
      control.sortInfoPopup.textContent = "Z-A";
      break;
    case 2: // default
      sortedArray = Array.from(product.list.children).sort(
        (a, b) => a.dataset.defaultIndex - b.dataset.defaultIndex
      );
      control.sortInfoPopup.textContent = "default";
  }

  showPopup(control.sortInfoPopup, 2, 1200, 100);

  sortedArray.forEach((elem, index) => (elem.dataset.currentIndex = index));

  product.list.replaceChildren(...sortedArray);
});

// Pressing new-button
control.newBtn.addEventListener("click", showProductCollection);

// Pressing form-button
control.formBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  modal.container.hidden = false;
  document.addEventListener("click", hideModal);
});

// Pressing ok-button in modal
modal.form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (Object.hasOwn(listCollection, modal.textInput.value)) {
    showPopup(modal.alertPopup, 1);
    return;
  }

  currentListName = modal.textInput.value;
  listCollection[currentListName] = {};

  product.list.querySelectorAll("li:has(input:checked)").forEach((listItem) => {
    addProductToCurrentListCollection(
      listItem.dataset.productKey,
      listItem.dataset.productName
    );
  });

  addCurrentListToSelectCollection();
  showCurrentListCollection();

  hideModal();
});

// We don't want to hide modal-container when clicking on modal-form
modal.form.addEventListener("click", (e) => e.stopPropagation());

// Pressing cancel-button in modal
modal.cancelBtn.addEventListener("click", hideModal);

// Pressing select-button
control.selectBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (control.selectList.hidden) {
    control.selectList.replaceChildren(...selectCollection);
    document.addEventListener("click", toggleSelectList);
  }

  toggleSelectList();
});
