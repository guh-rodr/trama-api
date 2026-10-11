import { ListQueryDto } from '../types/list';

export function buildPrismaPagination(query: ListQueryDto) {
  const { page } = query;

  const take = 10;
  const skip = (page - 1) * take;

  return {
    take,
    skip,
  };
}
