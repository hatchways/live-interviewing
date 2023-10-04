export const makeDeepCopy = (object: any) => {
    return JSON.parse(JSON.stringify(object))
}