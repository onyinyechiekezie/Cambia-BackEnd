class SenderService {
    constructor() {
        if(new.target === SenderService)  {
            throw new Error("Cannot instantiate absract class Sender directly");
        }
    }

    async 
}