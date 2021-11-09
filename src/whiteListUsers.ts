import { v4 as uuidv4 } from 'uuid';

const WhiteListUsersArr = () => {
    const arr = [{
        id: uuidv4(),
        userName: 'FernandoLarrosa2894',
        fullName: 'Fernando Larrosa',
        password: '38267212'
    },{
        id: uuidv4(),
        userName: 'Lucas2310',
        fullName: 'Lucas Sergio Villalba',
        password: '39159881'
    },{
        id: uuidv4(),
        userName: 'JudithLarrosa2078',
        fullName: 'Judith Romina Larrosa',
        password: '27051236'
    }]

    return arr
};
export const WhiteListedUsers: {id: string, userName: string, fullName: string, password: string}[] = WhiteListUsersArr();


