-- https://www.w3schools.com/MySQL/trymysql.asp?filename=trysql_select_all

select CustomerName, Count(OrderID)
from Customers c
left join Orders o on c.CustomerID = o.CustomerID
group by CustomerName
having Count(OrderID) > 20
order by CustomerName asc;