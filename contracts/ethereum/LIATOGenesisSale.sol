// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LIATOGenesisSale
 * @dev Référence vente publique ETH — corrige typo amountToBuy vs amountTobuy.
 */
contract LIATOGenesisSale is Ownable, ReentrancyGuard {
    IERC20 public troToken;
    uint256 public tokenPrice;
    uint256 public totalTokensForSale;
    uint256 public tokensSold;

    event TokensPurchased(address indexed buyer, uint256 amount);
    event SaleEnded(uint256 totalCollected);

    constructor(address _troToken, uint256 _tokenPrice, uint256 _totalTokens) Ownable(msg.sender) {
        troToken = IERC20(_troToken);
        tokenPrice = _tokenPrice;
        totalTokensForSale = _totalTokens;
    }

    function buyTokens() public payable nonReentrant {
        require(totalTokensForSale > 0, "Vente terminee");
        require(msg.value >= tokenPrice, "Fonds insuffisants");

        uint256 amountToBuy = msg.value / tokenPrice;
        require(amountToBuy <= totalTokensForSale, "Stock epuise");

        totalTokensForSale -= amountToBuy;
        tokensSold += amountToBuy;

        require(troToken.transfer(msg.sender, amountToBuy), "Transfert echoue");
        emit TokensPurchased(msg.sender, amountToBuy);
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function withdrawTokens(uint256 amount) public onlyOwner {
        troToken.transfer(msg.sender, amount);
    }
}
