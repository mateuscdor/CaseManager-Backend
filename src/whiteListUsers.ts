import { v4 as uuidv4 } from 'uuid';

export const WhiteListUsersArr = () => {
    const arr = [{
        userName: 'FernandoLarrosa2894',
        fullName: 'Fernando Larrosa',
        password: '38267212'
    },{
        userName: 'Lucas2310',
        fullName: 'Lucas Sergio Villalba',
        password: '39159881'
    },{
        userName: 'JudithLarrosa2078',
        fullName: 'Judith Romina Larrosa',
        password: '27051236'
    }].map(e => {
        return {...e, id: uuidv4()}
    });

    return arr
}

