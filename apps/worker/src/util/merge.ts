import {MergeDeep} from "type-fest";
import {merge} from "lodash-es";

export function mergeDeep<T1, T2>(o1: T1, o2: T2): MergeDeep<T1, T2>{
    return merge({}, o1, o2) as MergeDeep<T1, T2>;
}