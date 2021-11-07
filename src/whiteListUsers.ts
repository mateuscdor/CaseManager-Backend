import { v4 as uuidv4 } from 'uuid';

export const WhiteListUsersArr = () => {
    const arr = [{
        user: 'FernandoLarrosa2894',
        password: '38267212'
    }].map(e => {
        return {...e, id: uuidv4()}
    });

    return arr
}

