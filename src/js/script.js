import CyrillicToTranslit from "cyrillic-to-translit-js";
const cyrillicToTranslit = new CyrillicToTranslit();

const productForm = document.getElementById("product-form");
const productTextInput = document.getElementById("product-text-input");
const alertPopupForTextInput = productForm.querySelector(".alert");
const productList = document.getElementById("product-ordered-list");

const sortButton = document.getElementById("sort-button");
const formListButton = document.getElementById("form-list-button");

const productCollection = {};

let popupTimerID1;

const removeElementFromProductList = (e) => {
  delete productCollection[e.target.parentElement.dataset.productId];
  e.target.parentElement.remove();
};
const showPopup = (popup) => {
  popup.style.visibility = "visible";
  popup.style.opacity = 1;
  clearTimeout(popupTimerID1);
  popupTimerID1 = setTimeout(() => {
    popup.style.opacity = 0;
    setTimeout(() => {
      popup.style.visibility = "hidden";
    }, 200);
  }, 1800);
};

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
    showPopup(alertPopupForTextInput);
    return;
  }

  const productListElement = document.createElement("li");
  productListElement.dataset.productId = productID;
  productListElement.innerHTML = `
    <span><input id="${productID}" type="checkbox" /></span>
    <label for="${productID}">${productName}</label>
    <button>✖</button>
  `;
  productListElement.lastElementChild.addEventListener(
    "click",
    removeElementFromProductList,
    { once: true }
  );
  productList.append(productListElement);
  productCollection[productID] = productListElement;
});
