import {Order} from '../types'
import { MenuItem } from '../types'

export class OrderService {
    private order: Order

    constructor(initialOrder: Order = {}){
        this.order = {...initialOrder}
    }

    addItem(id: number, quant: number): void {
        this.order[id] = {
            ...this.order[id],
            quant: (this.order[id]?.quant || 0) + quant
        }
      }
    
    updateItems(items: {id: number; quant: number}[]):void{
        items.forEach(item => this.addItem(item.id, item.quant))
    }

    removeItem(id: number, quant: number): void{
        if(!this.order[id]){
            console.log("O item: " + this.order[id] + "não deve ser exluido" )
            return
        }
        this.order[id].quant -=quant
        if(this.order[id].quant <= 0){
            delete this.order[id];
            console.log("O item: " + this.order[id] + "foi excluido")
        }
    }

    deleteItems(ids: number[]): void {
        ids.forEach(id => {
            if (this.order[id]) {
                delete this.order[id];
                console.log("O item com id " + id + " foi deletado diretamente.");
            } else {
                console.log("Tentativa de deletar item inexistente com id: " + id);
            }
        });
    }

    clearOrder(): void{
        this.order = {}
        console.log("pedido limpo")
    }
    

    getOrderSummary(menu: MenuItem[]): string{
        const items = Object.entries(this.order).map(([id, item]) => {
            const menuItem = menu.find(m => m.id === Number(id))
            return menuItem ? `- ${menuItem.nome} (quantidade: ${item.quant})` : null
        }).filter(Boolean)

        return items.length > 0 ? `Itens no pedido:\n${items.join('\n')}`: 'Nenhum item no pedido.'
    }

    getCurrentOrder(): Order {
        return {...this.order}
    }

}