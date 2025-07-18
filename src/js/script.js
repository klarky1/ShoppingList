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
  formContainer: document.getElementById("modal-1"),
  form: document.getElementById("modal-form"),
  textInput: document.getElementById("modal-text-input"),
  cancelBtn: document.getElementById("modal-cancel-button"),
  alertPopup: document.getElementById("modal-form").querySelector(".alert"),
  confirmContainer: document.getElementById("modal-2"),
  yesBtn: document.getElementById("modal-yes-button"),
  noBtn: document.getElementById("modal-no-button"),
};

const control = {
  checkTooltip: document.getElementById("toggle-all-checkbox").previousElementSibling,
  checkbox: document.getElementById("toggle-all-checkbox"),
  checkBtn: document.getElementById("check-button"),
  actionBtn: document.getElementById("action-button"),
  actionList: document.getElementById("action-unordered-list"),
  sortBtn: document.getElementById("sort-button"),
  sortInfoPopup: document.getElementById("sort-button").querySelector(".sort-type-info"),
  formBtn: document.getElementById("form-button"),
  showBtn: document.getElementById("show-button"),
  selectBtn: document.getElementById("select-button"),
  selectList: document.getElementById("select-unordered-list"),
};

const action = {
  deleteSelectedBtn: document.getElementById("delete-selected-button"),
  resetColorsBtn: document.getElementById("reset-colors-button"),
  saveToDiskBtn: document.getElementById("save-to-disk-button"),
  deleteFromDiskBtn: document.getElementById("delete-from-disk-button"),
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

const updateFormAndActionDelSelectedBtn = () => {
  if (product.list.querySelector("li:has(input:checked)")) {
    control.formBtn.classList.remove("disabled");
    action.deleteSelectedBtn.firstElementChild.classList.remove("disabled");
  } else {
    control.formBtn.classList.add("disabled");
    action.deleteSelectedBtn.firstElementChild.classList.add("disabled");
  }
};

const updateActionResetBtn = () => {
  if (product.list.querySelector("li.selected-product")) {
    action.resetColorsBtn.firstElementChild.classList.remove("disabled");
  } else {
    action.resetColorsBtn.firstElementChild.classList.add("disabled");
  }
};

const updateActionSaveBtn = () => {
  if (Object.keys(productCollection).length !== 0 || selectCollection.length !== 0) {
    action.saveToDiskBtn.firstElementChild.classList.remove("disabled");
  } else {
    action.saveToDiskBtn.firstElementChild.classList.add("disabled");
  }
};
// START
// ** Functions for add-button **
const addProductToListCollection = (productID, productName, listName = currentListName) => {
  const listItem = document.createElement("li");
  listItem.dataset.productKey = productID;
  listItem.dataset.productName = productName;
  listItem.dataset.defaultIndex = Object.keys(listCollection[listName]).length;
  listItem.dataset.currentIndex = listItem.dataset.defaultIndex;
  listItem.innerHTML = `
    <label>${productName}</label>
    <button>✖</button>
  `;

  listItem.addEventListener("click", changeProductColor);
  listItem.lastElementChild.addEventListener("click", removeProductFromProductList);

  listCollection[listName][productID] = listItem;

  action.saveToDiskBtn.firstElementChild.classList.remove("disabled");
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
  listItem.firstElementChild.firstElementChild.addEventListener("change", updateFormAndActionDelSelectedBtn);
  listItem.lastElementChild.addEventListener("click", removeProductFromProductList);

  productCollection[productID] = listItem;

  action.saveToDiskBtn.firstElementChild.classList.remove("disabled");
};

const showProductFromListCollection = (productID, listName = currentListName) => {
  product.list.append(listCollection[listName][productID]);

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  }
};

const showProductFromProductCollection = (productID) => {
  product.list.append(productCollection[productID]);
  control.checkBtn.classList.remove("disabled");
  updateFormAndActionDelSelectedBtn();

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  }
};

// ** Functions for product (list-item) in product.list **
const changeProductColor = (e) => {
  e.target.closest("li").classList.toggle("selected-product");
  updateActionResetBtn();
};

const clickOnProductCheckbox = (e) => {
  if (e.target !== e.currentTarget) return;
  e.target.firstElementChild.click();
};

const removeProductFromProductList = (e) => {
  const listItem = e.target.parentElement;

  listItem.remove();

  if (isFormedListActive()) {
    deleteProductFromListCollection(listItem);
    updateActionResetBtn();
  } else {
    deleteProductFromProductCollection(listItem);
    updateFormAndActionDelSelectedBtn();

    if (product.list.children.length === 0) {
      control.checkBtn.classList.add("disabled");
    }
  }

  updateActionSaveBtn();

  if (product.list.children.length < 2) {
    control.sortBtn.classList.add("disabled");
  }
};

const deleteProductFromListCollection = (listItem, listName = currentListName) => {
  listItem.removeEventListener("click", changeProductColor);
  listItem.lastElementChild.removeEventListener("click", removeProductFromProductList);

  delete listCollection[listName][listItem.dataset.productKey];
};

const deleteProductFromProductCollection = (listItem) => {
  listItem.firstElementChild.removeEventListener("click", clickOnProductCheckbox);
  listItem.firstElementChild.firstElementChild.removeEventListener("change", updateFormAndActionDelSelectedBtn);
  listItem.lastElementChild.removeEventListener("click", removeProductFromProductList);

  delete productCollection[listItem.dataset.productKey];
};

// ** Functions for action-button (cog-icon) **
const toggleActionList = () => {
  control.actionList.hidden = !control.actionList.hidden;

  if (control.actionList.hidden) {
    document.removeEventListener("click", toggleActionList);
  }
};

// ** Functions for show-button **
const showProductCollection = () => {
  product.list.classList.remove("formed-list");
  action.resetColorsBtn.firstElementChild.classList.add("disabled");
  control.showBtn.classList.add("disabled");
  product.list.replaceChildren(
    ...Object.values(productCollection).sort((a, b) => a.dataset.currentIndex - b.dataset.currentIndex)
  );
  updateFormAndActionDelSelectedBtn();
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
  modal.formContainer.hidden = true;
  document.removeEventListener("click", hideModal);
};

// ** Functions for modal **
const addListToSelectCollection = (listName = currentListName) => {
  const listItem = document.createElement("li");
  listItem.dataset.listKey = listName;
  listItem.innerHTML = `
    <span>${listName}</span>
    <button>✖</button>
  `;

  listItem.addEventListener("click", makeSelectedListCurrent);
  listItem.lastElementChild.addEventListener("click", removeListFromSelectListAndCollection);

  selectCollection.push(listItem);
  control.selectBtn.classList.remove("disabled");

  selectCollection.forEach((listItem) => {
    listItem.classList.remove("selected-list");
  });
  listItem.classList.add("selected-list");
};

const showListCollection = (listName = currentListName) => {
  product.list.classList.add("formed-list");
  control.checkBtn.classList.add("disabled");
  control.showBtn.classList.remove("disabled");
  control.formBtn.classList.add("disabled");
  action.deleteSelectedBtn.firstElementChild.classList.add("disabled");
  product.list.replaceChildren(
    ...Object.values(listCollection[listName]).sort((a, b) => a.dataset.currentIndex - b.dataset.currentIndex)
  );

  updateActionResetBtn();

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

  showListCollection();

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

  updateActionSaveBtn();
};

const deleteListFromListCollection = (listName) => {
  Object.values(listCollection[listName]).forEach((listItem) => {
    deleteProductFromListCollection(listItem, listName);
  });

  delete listCollection[listName];
};

// ** Listeners **
// When the app loaded
window.addEventListener("load", () => {
  if (!localStorage.getItem("shopping-list-data")) return;

  const shoppingListData = JSON.parse(localStorage.getItem("shopping-list-data"));

  shoppingListData.productCollection.forEach(([productID, productName]) => {
    addProductToProductCollection(productID, productName);
  });

  Object.entries(shoppingListData.listCollection).forEach(([listName, list]) => {
    listCollection[listName] = {};
    addListToSelectCollection(listName);
    list.forEach(([productID, productName]) => {
      addProductToListCollection(productID, productName, listName);
    });
  });

  currentListName = shoppingListData.currentListName;
  if (currentListName) {
    showListCollection();
  } else {
    showProductCollection();
  }

  action.deleteFromDiskBtn.firstElementChild.classList.remove("disabled");
});

// Pressing x-button in product.textInput
product.form.addEventListener("reset", () => product.textInput.focus());

// Pressing add-button
product.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const productName = product.textInput.value.trim()[0].toUpperCase() + product.textInput.value.trim().slice(1);
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

    addProductToListCollection(productID, productName);
    showProductFromListCollection(productID);
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
    product.list.querySelectorAll('input[type="checkbox"]').forEach((elem) => (elem.checked = true));
    control.checkTooltip.innerHTML = "Remove<br>all";
  } else {
    product.list.querySelectorAll('input[type="checkbox"]').forEach((elem) => (elem.checked = false));
    control.checkTooltip.innerHTML = "Select<br>all";
  }

  updateFormAndActionDelSelectedBtn();
});

// Pressing action-button (cog-icon)
control.actionBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (control.actionList.hidden) {
    document.addEventListener("click", toggleActionList);
  }

  toggleActionList();
});

// Pressing delete-selected-button in control.actionList
action.deleteSelectedBtn.addEventListener("click", (e) => {
  if (action.deleteSelectedBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  product.list.querySelectorAll("li:has(input:checked)").forEach((listItem) => {
    removeProductFromProductList({ target: listItem.lastElementChild });
  });

  updateActionSaveBtn();
});

// Pressing reset-colors-button in control.actionList
action.resetColorsBtn.addEventListener("click", (e) => {
  if (action.resetColorsBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  Array.from(product.list.children).forEach((listItem) => {
    listItem.classList.remove("selected-product");
  });

  updateActionResetBtn();
});

// Pressing save-to-disk-button in control.actionList
action.saveToDiskBtn.addEventListener("click", (e) => {
  if (action.saveToDiskBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  const shoppingListData = {
    productCollection: [],
    listCollection: {},
  };

  Object.values(productCollection).forEach((listItem) => {
    shoppingListData.productCollection.push([listItem.dataset.productKey, listItem.dataset.productName]);
  });
  Object.entries(listCollection).forEach(([listName, list]) => {
    shoppingListData.listCollection[listName] = [];
    Object.values(list).forEach((listItem) => {
      shoppingListData.listCollection[listName].push([listItem.dataset.productKey, listItem.dataset.productName]);
    });
  });
  shoppingListData.currentListName = currentListName;

  localStorage.setItem("shopping-list-data", JSON.stringify(shoppingListData));

  action.deleteFromDiskBtn.firstElementChild.classList.remove("disabled");
});

// Pressing delete-from-disk-button in control.actionList
action.deleteFromDiskBtn.addEventListener("click", (e) => {
  if (action.deleteFromDiskBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  modal.confirmContainer.hidden = false;
});

// Pressing yes-button in modal
modal.yesBtn.addEventListener("click", () => {
  localStorage.clear();

  action.deleteFromDiskBtn.firstElementChild.classList.add("disabled");

  modal.confirmContainer.hidden = true;
});

// Pressing no-button in modal
modal.noBtn.addEventListener("click", () => {
  modal.confirmContainer.hidden = true;
});

// Pressing sort-button
control.sortBtn.addEventListener("click", () => {
  sortIndex++;
  if (isFormedListActive() && product.list.querySelector("li.selected-product")) {
    if (sortIndex === 2) sortIndex = 3;
    if (sortIndex > 5) sortIndex = 0;
  } else {
    if (sortIndex > 2) sortIndex = 0;
  }
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
    case 3: // green up
      sortedArray = Array.of(
        ...product.list.querySelectorAll("li.selected-product"),
        ...product.list.querySelectorAll("li:not(.selected-product)")
      );
      control.sortInfoPopup.textContent = "green up";
      break;
    case 4: // green down
      sortedArray = Array.of(
        ...product.list.querySelectorAll("li:not(.selected-product)"),
        ...product.list.querySelectorAll("li.selected-product")
      );
      control.sortInfoPopup.textContent = "green down";
      break;
    default: // default
      sortedArray = Array.from(product.list.children).sort((a, b) => a.dataset.defaultIndex - b.dataset.defaultIndex);
      control.sortInfoPopup.textContent = "default";
  }

  showPopup(control.sortInfoPopup, 2, 1200, 100);

  sortedArray.forEach((elem, index) => (elem.dataset.currentIndex = index));

  product.list.replaceChildren(...sortedArray);
});

// Pressing show-button
control.showBtn.addEventListener("click", showProductCollection);

// Pressing form-button
control.formBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  modal.formContainer.hidden = false;
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
    addProductToListCollection(listItem.dataset.productKey, listItem.dataset.productName);
  });

  addListToSelectCollection();
  showListCollection();

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
